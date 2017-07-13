import logging
from typing import Dict

from peek_plugin_diagram._private.storage.Display import DispTextStyle, DispLineStyle, \
    DispColor, DispLevel, DispLayer, DispGroupPointer
from peek_plugin_diagram.tuples.model.ImportLiveDbDispLinkTuple import \
    ImportLiveDbDispLinkTuple
from peek_plugin_livedb.tuples.ImportLiveDbItemTuple import ImportLiveDbItemTuple
from sqlalchemy import select

# NO_SYMBOL = "NO_SYMBOL"
#
# DRESSING_GRID_KEY = "dressings"
# DRESSING_COORD_SET_NAME = "dressings"

logger = logging.getLogger(__name__)

textTable = DispTextStyle.__table__
lineTable = DispLineStyle.__table__
colorTable = DispColor.__table__
levelTable = DispLevel.__table__
layerTable = DispLayer.__table__


class LookupHashConverter:
    def __init__(self, ormSession, modelSetId: int, coordSetId: int):
        self._ormSession = ormSession
        self._modelSetId = modelSetId
        self._coordSetId = coordSetId

        assert modelSetId is not None, "modelSetId is None"
        assert coordSetId is not None, "coordSetId is None"

        self._textStyleIdByImportHash = self._loadLookupByModelSet(textTable)
        self._lineStyleIdByImportHash = self._loadLookupByModelSet(lineTable)
        self._colorIdByImportHash = self._loadLookupByModelSet(colorTable)
        self._levelByImportHash = self._loadLookupByCoordSet(levelTable)
        self._layerByImportHash = self._loadLookupByModelSet(layerTable)

    def _loadLookupByModelSet(self, table) -> Dict[str, int]:

        resultSet = self._ormSession.execute(
            select([table.c.importHash, table.c.id])
                .where(table.c.modelSetId == self._modelSetId))

        return dict(resultSet.fetchall())

    def _loadLookupByCoordSet(self, table) -> Dict[str, int]:

        resultSet = self._ormSession.execute(
            select([table.c.importHash, table.c.id])
                .where(table.c.coordSetId == self._coordSetId))

        return dict(resultSet.fetchall())

    def convertLookups(self, disp):

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

        for attrName in (T.DISP_ATTR_TEXT_STYLE,):
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
            raise NotImplementedError("Not implemented")

    def _getTextStyleId(self, importHash):
        importHash = str(importHash)

        if importHash in self._textStyleIdByImportHash:
            return self._textStyleIdByImportHash[importHash]

        textStyle = DispTextStyle()
        textStyle.modelSetId = self._modelSetId
        textStyle.name = "Peek Created %s" % importHash
        textStyle.importHash = importHash

        self._ormSession.add(textStyle)
        self._ormSession.commit()
        self._textStyleIdByImportHash[importHash] = textStyle.id
        return textStyle.id

    def _getLineStyleId(self, importHash):
        importHash = str(importHash)

        if importHash in self._lineStyleIdByImportHash:
            return self._lineStyleIdByImportHash[importHash]

        newLine = DispLineStyle()
        newLine.modelSetId = self._modelSetId
        newLine.name = "Peek Created %s" % importHash
        newLine.capStyle = "butt"
        newLine.joinStyle = "miter"
        newLine.winStyle = 1
        newLine.importHash = importHash

        self._ormSession.add(newLine)
        self._ormSession.commit()
        self._lineStyleIdByImportHash[importHash] = newLine.id
        return newLine.id

    def _getColourId(self, importHash):
        if importHash is None:
            return None

        importHash = str(importHash)

        if importHash in self._colorIdByImportHash:
            return self._colorIdByImportHash[importHash]

        newColor = DispColor()
        newColor.modelSetId = self._modelSetId
        newColor.name = "Peek Created %s" % importHash
        newColor.color = "#ffffff"
        newColor.importHash = importHash

        self._ormSession.add(newColor)
        self._ormSession.commit()
        self._colorIdByImportHash[importHash] = newColor.id
        return newColor.id

    def _getLevelId(self, importHash, defaultOrder=None):
        importHash = str(importHash)

        if importHash in self._levelByImportHash:
            return self._levelByImportHash[importHash]

        newLevel = DispLevel()
        newLevel.coordSetId = self._coordSetId
        newLevel.name = "Peek Created %s" % importHash
        newLevel.order = importHash if defaultOrder is None else defaultOrder
        newLevel.importHash = "%s:%s" % (self._coordSetId, importHash)
        newLevel.minZoom = 0
        newLevel.maxZoom = 10000

        self._ormSession.add(newLevel)
        self._ormSession.commit()
        self._levelByImportHash[importHash] = newLevel.id
        return newLevel.id

    def _getLayerId(self, importHash, defaultOrder=None):
        importHash = str(importHash)

        if importHash in self._layerByImportHash:
            return self._layerByImportHash[importHash]

        newLayer = DispLayer()
        newLayer.modelSetId = self._modelSetId
        newLayer.name = "Peek Created %s" % importHash
        newLayer.order = importHash if defaultOrder is None else defaultOrder
        newLayer.importHash = importHash

        self._ormSession.add(newLayer)
        self._ormSession.commit()
        self._layerByImportHash[importHash] = newLayer.id
        return newLayer.id

    # ---------------------------------------------------------------
    # Live DB Value Translations
