import logging

from twisted.internet.defer import inlineCallbacks, returnValue

from peek_plugin_diagram._private.storage.Display import DispTextStyle, DispLineStyle, \
    DispColor, DispLevel, DispLayer, DispGroupPointer
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram.tuples.model.ImportLiveDbDispLinkTuple import \
    ImportLiveDbDispLinkTuple
from peek_plugin_livedb.tuples.ImportLiveDbItemTuple import ImportLiveDbItemTuple
from vortex.DeferUtil import deferToThreadWrapWithLogger

NO_SYMBOL = "NO_SYMBOL"

DRESSING_GRID_KEY = "dressings"
DRESSING_COORD_SET_NAME = "dressings"

logger = logging.getLogger(__name__)


class DispLookupDataCache(object):
    AGENT_KEY_SEND_CHUNK = 500

    def __init__(self, dbSessionCreator):
        self._dbSessionCreator = dbSessionCreator
        self._handlersByCoordSetId = {}

    @inlineCallbacks
    def convertLookups(self, coordSetId, disp) -> None:
        handler = yield self.__getHandler(coordSetId)
        handler.convertLookups(disp)

    @inlineCallbacks
    def liveDbValueTranslate(self, coordSetId, dataType, value):
        handler = yield self.__getHandler(coordSetId)
        val = handler._liveDbTranslators[dataType](value)

        if handler._isExpired:
            self.refreshAll()

        returnValue(val)

    @inlineCallbacks
    def __getHandler(self, coordSetId):
        if coordSetId in self._handlersByCoordSetId:
            return self._handlersByCoordSetId[coordSetId]

        newHandler = _DispLookupDataCacheHandler(self._dbSessionCreator, coordSetId)
        yield newHandler.load()
        self._handlersByCoordSetId[coordSetId] = newHandler
        return newHandler

    def refreshAll(self):
        for handler in list(self._handlersByCoordSetId.values()):
            handler.setExpired()
        self._handlersByCoordSetId = {}

    def shutdown(self):
        pass


class _DispLookupDataCacheHandler(object):
    def __init__(self, dbSessionCreator, coordSetId):
        self._dbSessionCreator = dbSessionCreator
        self._coordSetId = coordSetId
        self._expired = False

    @deferToThreadWrapWithLogger(logger)
    def load(self):
        ormSession = self._dbSessionCreator()
        try:
            self._modelSetId = (None if self._coordSetId is None else
                                ormSession
                                .query(ModelCoordSet)
                                .filter(ModelCoordSet.id == self._coordSetId)
                                .one().modelSetId)

            # dressingCoordSet = getOrCreateCoordSet(session,
            #                                        modelSetName,
            #                                        DRESSING_COORD_SET_NAME)

            self._textStyleIdByImportHash = {str(s.importHash): s.id
                                             for s in ormSession.query(DispTextStyle)}

            # self._textStyleByEnmacFontIndex = {str(s.importHash): s
            #                                    for s in session.query(DispTextStyle)}

            self._lineStyleIdByImportHash = {s.importHash: s.id
                                             for s in ormSession.query(DispLineStyle)}

            self._colorIdByImportHash = {s.importHash: s.id
                                         for s in ormSession.query(DispColor)}

            qry = (
                ormSession.query(DispLevel)
                    .filter(DispLevel.coordSetId == self._coordSetId)
            )

            self._levelByImportHash = {s.importHash.split(':')[1]: s.id for s in qry}
            self._levelById = {s.id: s for s in qry}

            self._layerByImportHash = {s.importHash: s.id
                                       for s in ormSession.query(DispLayer)}

            # self.emptyDressingId = None
            # qry = (session.query(DispGroup)
            #        .filter(DispGroup.coordSetId == dressingCoordSet.id)
            #        .filter(DispGroup.name == NO_SYMBOL))
            #
            # if qry.count():
            #     self.emptyDressingId = qry.one().id
            #
            # else:
            #     emptyDressing = DispGroup()
            #     emptyDressing.coordSetId = dressingCoordSet.id
            #     emptyDressing.name = NO_SYMBOL
            #     session.add(emptyDressing)
            #     session.commit()
            #     self.emptyDressingId = qry.one().id

            ormSession.expunge_all()

            self._liveDbTranslators = {
                ImportLiveDbItemTuple.DATA_TYPE_COLOR: self._liveDbValueTranslateColorId,
                ImportLiveDbItemTuple.DATA_TYPE_LINE_STYLE: self._liveDbValueTranslateLineStyleId,
                ImportLiveDbItemTuple.DATA_TYPE_LINE_WIDTH: self._liveDbValueTranslateLineWidth,
                ImportLiveDbItemTuple.DATA_TYPE_STRING_VALUE: self._liveDbValueTranslateText,
                ImportLiveDbItemTuple.DATA_TYPE_NUMBER_VALUE: self._liveDbValueTranslateNumber,
                ImportLiveDbItemTuple.DATA_TYPE_GROUP_PTR: self._liveDbValueTranslateGroupId,
            }
        finally:
            ormSession.close()

    def setExpired(self):
        self._expired = True

    @deferToThreadWrapWithLogger(logger)
    def convertLookups(self, disp):
        if self._expired:
            raise Exception("Do not keep references to _DispLookupDataCacheHandler")
        # return dispLookupDataCache.getHandler(self._coordSetId).convertLookups(disp)

        T = ImportLiveDbDispLinkTuple

        colourFields = {T.DISP_ATTR_FILL_COLOR, T.DISP_ATTR_LINE_COLOR, T.DISP_ATTR_COLOR}

        for attrName in colourFields:
            if not hasattr(disp, attrName) or getattr(disp, attrName) is None:
                continue
            setattr(disp, attrName,
                    self._getColourId(getattr(disp, attrName)))

        for attrName in (T.DISP_ATTR_LINE_STYLE,):
            if not hasattr(disp, attrName) or getattr(disp, attrName) is None:
                continue
            setattr(disp, attrName,
                    self._getLineStyleId(getattr(disp, attrName)))

        for attrName in (T.DISP_ATTR_TEXT,):
            if not hasattr(disp, attrName) or getattr(disp, attrName) is None:
                continue
            setattr(disp, attrName,
                    self._getTextStyleId(getattr(disp, attrName)))

        for attrName in ['levelId']:
            if not hasattr(disp, attrName) or getattr(disp, attrName) is None:
                continue
            setattr(disp, attrName, self._getLevelId(getattr(disp, attrName)))

        for attrName in ['layerId']:
            if not hasattr(disp, attrName) or getattr(disp, attrName) is None:
                continue
            setattr(disp, attrName, self._getLayerId(getattr(disp, attrName)))

        if isinstance(disp, DispGroupPointer):
            disp.groupId = self._emptyDressingId

    def _getTextStyleId(self, importHash):
        importHash = str(importHash)
        # FIX for missing fonts
        if importHash in self._textStyleIdByImportHash:
            return self._textStyleIdByImportHash[importHash]

        if self._modelSetId is None:
            raise Exception("Adhoc Level creation can't occur when modelSet is None")

        textStyle = DispTextStyle()
        textStyle.modelSetId = self._modelSetId
        textStyle.name = "Peek Created %s" % importHash
        textStyle.importHash = importHash

        ormSession = self._dbSessionCreator()
        try:
            ormSession.add(textStyle)
            ormSession.commit()
            newId = textStyle.id
            ormSession.expunge_all()

            self._textStyleIdByImportHash[importHash] = newId
            self.setExpired()
            return newId

        finally:
            ormSession.close()

    def _getLineStyleId(self, importHash):
        importHash = str(importHash)
        # FIX for missing line styles
        if importHash in self._lineStyleIdByImportHash:
            return self._lineStyleIdByImportHash[importHash]

        if self._modelSetId is None:
            raise Exception("Adhoc Level creation can't occur when modelSet is None")

        newLine = DispLineStyle()
        newLine.modelSetId = self._modelSetId
        newLine.name = "Peek Created %s" % importHash
        newLine.capStyle = "butt"
        newLine.joinStyle = "miter"
        newLine.winStyle = 1
        newLine.importHash = importHash

        ormSession = self._dbSessionCreator()
        try:
            ormSession.add(newLine)
            ormSession.commit()
            newId = newLine.id
            ormSession.expunge_all()

            self._lineStyleIdByImportHash[importHash] = newId
            self.setExpired()
            return newId
        finally:
            ormSession.close()

    def _getColourId(self, importHash):
        if importHash is None:
            return None

        importHash = str(importHash)
        if importHash in self._colorIdByImportHash:
            return self._colorIdByImportHash[importHash]

        if self._modelSetId is None:
            raise Exception("Adhoc Level creation can't occur when modelSet is None")

        newColor = DispColor()
        newColor.modelSetId = self._modelSetId
        newColor.name = "Peek Created %s" % importHash
        newColor.color = "#ffffff"
        newColor.importHash = importHash

        ormSession = self._dbSessionCreator()
        try:
            ormSession.add(newColor)
            ormSession.commit()
            newId = newColor.id
            ormSession.expunge_all()

            self._colorIdByImportHash[importHash] = newId
            self.setExpired()
            return newId
        finally:
            ormSession.close()

    def _getLevelId(self, importHash, defaultOrder=None):
        importHash = str(importHash)
        if importHash in self._levelByImportHash:
            return self._levelByImportHash[importHash]

        if self._modelSetId is None:
            raise Exception("Adhoc Level creation can't occur when modelSet is None")

        newLevel = DispLevel()
        newLevel.coordSetId = self._coordSetId
        newLevel.name = "Peek Created %s" % importHash
        newLevel.order = importHash if defaultOrder is None else defaultOrder
        newLevel.importHash = "%s:%s" % (self._coordSetId, importHash)
        newLevel.minZoom = 0
        newLevel.maxZoom = 10000

        ormSession = self._dbSessionCreator()
        try:
            ormSession.add(newLevel)
            ormSession.commit()
            newId = newLevel.id
            ormSession.expunge_all()

            self._levelByImportHash[importHash] = newId
            self.setExpired()
            return newId
        except:
            ormSession.close()


    def _getLayerId(self, importHash, defaultOrder=None):
        importHash = str(importHash)

        if importHash in self._layerByImportHash:
            return self._layerByImportHash[importHash]

        if self._modelSetId is None:
            raise Exception("Adhoc Layer creation can't occur when modelSet is None")

        newLayer = DispLayer()
        newLayer.modelSetId = self._modelSetId
        newLayer.name = "Peek Created %s" % importHash
        newLayer.order = importHash if defaultOrder is None else defaultOrder
        newLayer.importHash = importHash

        ormSession = self._dbSessionCreator()
        try:
            ormSession.add(newLayer)
            ormSession.commit()
            newId = newLayer.id
            ormSession.expunge_all()

            self._layerByImportHash[importHash] = newId
            self.setExpired()
            return newId
        finally:
            ormSession.close()


    # ---------------------------------------------------------------
    # Live DB Value Translations

    def _liveDbValueTranslateColorId(self, value):
        return self._getColourId(importHash=value)

        # return self._colorIdByImportHash.get(value, self._colorIdByImportHash["0"])

    def _liveDbValueTranslateLineStyleId(self, value):
        return self._getLineStyleId(importHash=value)

    def _liveDbValueTranslateLineWidth(self, value):
        return value

    def _liveDbValueTranslateText(self, value):
        return '' if value is None else value

    def _liveDbValueTranslateNumber(self, value):
        return value

    def _liveDbValueTranslateGroupId(self, value):
        raise NotImplementedError()
        try:
            mapName = link.props['actionAppearance']
            return self._groupIdByMapByDressing[mapName][liveDbKey.value]
        except:
            return self._groupIdFallback
