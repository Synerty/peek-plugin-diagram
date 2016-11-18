import logging

from peek.core.orm import getNovaOrmSession
from peek.core.orm.Display import DispTextStyle, DispLineStyle, DispColor, DispLevel, \
    DispLayer, DispGroupPointer
from peek.core.orm.LiveDb import LiveDbKey
from peek.core.orm.ModelSet import ModelCoordSet

NO_SYMBOL = "NO_SYMBOL"

DRESSING_GRID_KEY = "dressings"
DRESSING_COORD_SET_NAME = "dressings"

logger = logging.getLogger(__name__)


class DispLookupDataCache(object):
    # Singleton
    _instance = None

    AGENT_KEY_SEND_CHUNK = 500

    def __new__(cls):
        if not cls._instance:
            cls._instance = super(DispLookupDataCache, cls).__new__(cls)
            cls._instance.__singleton_init__()

        return cls._instance

    def __singleton_init__(self):
        self._handlersByCoordSetId = {}

    def getHandler(self, coordSetId):
        if coordSetId in self._handlersByCoordSetId:
            return self._handlersByCoordSetId[coordSetId]

        newHandler = _DispLookupDataCacheHandler(coordSetId)
        self._handlersByCoordSetId[coordSetId] = newHandler
        return newHandler

    def refreshAll(self):
        for handler in list(self._handlersByCoordSetId.values()):
            handler.setExpired()
        self._handlersByCoordSetId = {}


dispLookupDataCache = DispLookupDataCache()


class _DispLookupDataCacheHandler(object):
    def __init__(self, coordSetId):
        self._coordSetId = coordSetId
        self._expired = False

        session = getNovaOrmSession()

        self._modelSetId = (None if self._coordSetId is None else
                            session
                            .query(ModelCoordSet)
                            .filter(ModelCoordSet.id == self._coordSetId)
                            .one().modelSetId)

        # dressingCoordSet = getOrCreateCoordSet(session,
        #                                        modelSetName,
        #                                        DRESSING_COORD_SET_NAME)

        self._textStyleIdByImportHash = {str(s.importHash): s.id
                                         for s in session.query(DispTextStyle)}

        # self._textStyleByEnmacFontIndex = {str(s.importHash): s
        #                                    for s in session.query(DispTextStyle)}

        self._lineStyleIdByImportHash = {s.importHash: s.id
                                         for s in session.query(DispLineStyle)}

        self._colorIdByImportHash = {s.importHash: s.id
                                     for s in session.query(DispColor)}

        qry = session.query(DispLevel).filter(DispLevel.coordSetId == coordSetId)
        self._levelByImportHash = {s.importHash.split(':')[1]: s.id for s in qry}
        self._levelById = {s.id: s for s in qry}

        self._layerByImportHash = {s.importHash: s.id
                                   for s in session.query(DispLayer)}

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

        session.expunge_all()
        session.close()

        self._liveDbTranslators = {LiveDbKey.COLOR: self._liveDbValueTranslateColorId,
                                   LiveDbKey.LINE_STYLE: self._liveDbValueTranslateLineStyleId,
                                   LiveDbKey.LINE_WIDTH: self._liveDbValueTranslateLineWidth,
                                   LiveDbKey.STRING_VALUE: self._liveDbValueTranslateText,
                                   LiveDbKey.NUMBER_VALUE: self._liveDbValueTranslateNumber,
                                   LiveDbKey.GROUP_PTR: self._liveDbValueTranslateGroupId,
                                   }
    def setExpired(self):
        self._expired = True

    def convertLookups(self, disp):
        if self._expired:
            return dispLookupDataCache.getHandler(self._coordSetId).convertLookups(disp)

        for attrName in ['lineColorId', 'fillColorId', 'colorId']:
            if not hasattr(disp, attrName) or getattr(disp, attrName) is None:
                continue
            setattr(disp, attrName,
                    self._getColourId(getattr(disp, attrName)))

        for attrName in ['lineStyleId']:
            if not hasattr(disp, attrName) or getattr(disp, attrName) is None:
                continue
            setattr(disp, attrName,
                    self._getLineStyleId(getattr(disp, attrName)))

        for attrName in ['textStyleId']:
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

        session = getNovaOrmSession()
        session.add(textStyle)
        session.commit()
        newId = textStyle.id
        session.expunge_all()
        session.close()

        self._textStyleIdByImportHash[importHash] = newId

        dispLookupDataCache.refreshAll()

        return newId

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

        session = getNovaOrmSession()
        session.add(newLine)
        session.commit()
        newId = newLine.id
        session.expunge_all()
        session.close()

        self._lineStyleIdByImportHash[importHash] = newId

        dispLookupDataCache.refreshAll()

        return newId

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

        session = getNovaOrmSession()
        session.add(newColor)
        session.commit()
        newId = newColor.id
        session.expunge_all()
        session.close()

        self._colorIdByImportHash[importHash] = newId

        dispLookupDataCache.refreshAll()

        return newId

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

        session = getNovaOrmSession()
        session.add(newLevel)
        session.commit()
        newId = newLevel.id
        session.expunge_all()
        session.close()

        self._levelByImportHash[importHash] = newId

        dispLookupDataCache.refreshAll()

        return newId

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

        session = getNovaOrmSession()
        session.add(newLayer)
        session.commit()
        newId = newLayer.id
        session.expunge_all()
        session.close()

        self._layerByImportHash[importHash] = newId

        dispLookupDataCache.refreshAll()

        return newId

    def liveDbValueTranslate(self, dataType, value):
        if self._expired:
            return (dispLookupDataCache
                    .getHandler(self._coordSetId)
                    .liveDbValueTranslate(dataType, value))

        return self._liveDbTranslators[dataType](value)

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
