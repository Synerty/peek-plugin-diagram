import json
import logging
import math
from _collections import defaultdict
from datetime import datetime
from typing import Dict, List

from collections import namedtuple
from sqlalchemy.orm import subqueryload
from sqlalchemy.sql.selectable import Select

from peek_plugin_base.storage.StorageUtil import makeCoreValuesSubqueryCondition, \
    makeOrmValuesSubqueryCondition
from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.GridKeyUtil import GRID_SIZES, makeGridKey
from peek_plugin_diagram._private.storage.Display import DispBase, DispText, \
    DispTextStyle, DispEllipse
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyIndex, \
    DispIndexerQueue, GridKeyCompilerQueue
from peek_plugin_diagram._private.storage.LiveDbDispLink import \
    LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet, ModelSet
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from peek_plugin_livedb.tuples.ImportLiveDbItemTuple import ImportLiveDbItemTuple
from peek_plugin_livedb.worker.WorkerApi import WorkerApi
from txcelery.defer import DeferrableTask

logger = logging.getLogger(__name__)

CoordSetIdGridKeyTuple = namedtuple("CoordSetIdGridKeyTuple", ["coordSetId", "gridKey"])
DispData = namedtuple('DispData', ['json', 'levelOrder', 'layerOrder'])

SMALLEST_SHAPE_SIZE = 2.0
SMALLEST_TEXT_SIZE = 6.0  # No one will be reading fonts this small


@DeferrableTask
@celeryApp.task(bind=True)
def compileDisps(self, queueIds, dispIds):
    startTime = datetime.utcnow()

    dispBaseTable = DispBase.__table__
    gridQueueTable = GridKeyCompilerQueue.__table__
    gridTable = GridKeyIndex.__table__
    dispQueueTable = DispIndexerQueue.__table__

    ormSession = CeleryDbConn.getDbSession()
    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    try:

        # Get Model Set Name Map
        modelSetNameByCoordId = {o[0]: o[1] for o in
                                 ormSession.query(ModelCoordSet.id,
                                                  ModelSet.name).all()}

        # Get Model Set Name Map
        textStyleById = {ts.id: ts for ts in ormSession.query(DispTextStyle).all()}

        # -----
        # Begin the DISP merge from live data
        dispsQry = (ormSession.query(DispBase)
            .options(subqueryload(DispBase.liveDbLinks),
                     subqueryload(DispBase.level))
            .filter(makeOrmValuesSubqueryCondition(ormSession, DispBase.id, dispIds))
        )

        # print dispsQry
        dispsAll = dispsQry.all()

        liveDbKeysByModelSetName = defaultdict(list)
        for disp in dispsQry:
            # Add a reference to the model set name for convininece
            disp.modelSetName = modelSetNameByCoordId[disp.coordSetId]
            liveDbKeysByModelSetName[disp.modelSetName].extend(
                [dl.liveDbKey for dl in disp.liveDbLinks]
            )

        liveDbItemByModelSetNameByKey = {}
        for modelSetName, liveDbKeys in liveDbKeysByModelSetName.items():
            liveDbItemByModelSetNameByKey[modelSetName] = {
                i.key: i for i in
                WorkerApi.getLiveDbDisplayValues(ormSession, modelSetName, liveDbKeys)
            }

        logger.debug("Loaded %s disp objects in %s",
                     len(dispsAll), (datetime.utcnow() - startTime))

        # List of type CoordSetIdGridKeyTuple
        gridCompiledQueueItems = set()

        # GridKeyIndexes to insert
        gridKeyIndexesByDispId = defaultdict(list)

        for disp in dispsQry:
            liveDbItemByKey = liveDbItemByModelSetNameByKey[disp.modelSetName]
            # Apply live db links
            _mergeInLiveDbValues(disp, liveDbItemByKey)

            # If this is a text disp, and there is no text, don't include it
            if isinstance(disp, DispText) and not disp.text:
                continue

            # Deflate to json
            jsonDict = disp.tupleToSmallJsonDict()
            jsonDict["g"] = json.loads(disp.geomJson)
            disp.dispJson = json.dumps(jsonDict)

            for gridKey in makeGridKeys(disp, textStyleById):
                gridCompiledQueueItems.add(
                    CoordSetIdGridKeyTuple(coordSetId=disp.coordSetId,
                                           gridKey=gridKey)
                )

                gridKeyIndexesByDispId[disp.id].append(
                    dict(dispId=disp.id,
                         coordSetId=disp.coordSetId,
                         gridKey=gridKey,
                         importGroupHash=disp.importGroupHash))

        logger.debug("Updated %s disp objects in %s",
                     len(dispsAll), (datetime.utcnow() - startTime))

        ormSession.commit()
        logger.debug("Committed %s disp objects in %s",
                     len(dispsAll), (datetime.utcnow() - startTime))

    except Exception as e:
        ormSession.rollback()
        # logger.exception(e)
        logger.warning(e)
        raise self.retry(exc=e, countdown=10)

    finally:
        ormSession.close()

    # -----
    # Begin the GridKeyIndex updates

    transaction = conn.begin()
    try:
        lockedDispIds = conn.execute(Select(
            whereclause=
            makeCoreValuesSubqueryCondition(engine, dispBaseTable.c.id, dispIds),
            columns=[dispBaseTable.c.id],
            for_update=True))

        # Ensure that the Disps exist, otherwise we get an integrity error.
        gridKeyIndexes = []
        for dispId, in lockedDispIds:
            gridKeyIndexes.extend(gridKeyIndexesByDispId[dispId])

        conn.execute(gridTable.delete(
            makeCoreValuesSubqueryCondition(engine, gridTable.c.dispId, dispIds)
        ))
        if gridKeyIndexes:
            conn.execute(gridTable.insert(), gridKeyIndexes)

        # ---------------
        # Directly insert into the Grid compiler queue.
        if gridCompiledQueueItems:
            conn.execute(
                gridQueueTable.insert(),
                [dict(coordSetId=i.coordSetId, gridKey=i.gridKey)
                 for i in gridCompiledQueueItems]
            )

        # ---------------
        # Finally, delete the disp queue items

        conn.execute(dispQueueTable.delete(
            makeCoreValuesSubqueryCondition(engine, dispQueueTable.c.id, queueIds)
        ))

        transaction.commit()
        logger.debug("Committed %s GridKeyIndex in %s",
                     len(gridKeyIndexes), (datetime.utcnow() - startTime))

    except Exception as e:
        transaction.rollback()
        # logger.exception(e)
        logger.warning(e)
        raise self.retry(exc=e, countdown=10)

    finally:
        conn.close()


def _mergeInLiveDbValues(disp, liveDbItemByKey):
    for dispLink in disp.liveDbLinks:
        liveDbItem = liveDbItemByKey.get(dispLink.liveDbKey)
        if liveDbItem:
            _mergeInLiveDbValue(disp, dispLink, liveDbItem)


def _mergeInLiveDbValue(disp, dispLink, liveDbItem, value=None):
    # This allows us to change the value and use recursion a little
    # (Value is converted to different data types and recursively called, see below)
    if value is None:
        value = liveDbItem.displayValue

    # At least for colors :
    # If the color vale is None, set the attribute to None as well
    # At this stage we don't expect other data types to be None
    if value is None:
        keyType = LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR[dispLink.dispAttrName]
        assert keyType == ImportLiveDbItemTuple.DATA_TYPE_COLOR
        setattr(disp, dispLink.dispAttrName, None)
        return

    # ----------------------------
    # Not text
    if not (isinstance(disp, DispText) and dispLink.dispAttrName == "text"):
        setattr(disp, dispLink.dispAttrName, value)
        return

        # ----------------------------
    # Special case for Text

    # If there is no format, then just use the value
    if not disp.textFormat:
        disp.text = value
        return

    _applyTextFormat(disp, dispLink, liveDbItem, value)


def _applyTextFormat(disp, dispLink, liveDbItem, value):
    # If there is a format, then convert it.
    try:
        disp.text = (disp.textFormat % value)

    except TypeError as e:
        message = str(e)
        # Lazy format type detection
        try:
            if "number is required" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, int(value))

            if "invalid literal for int" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, int(value))

            if "an integer is required, not str" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, int(value))

            if "float is required" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, float(value))

            if "must be real number, not str" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, float(value))

            if "could not convert string to float" in message:
                return _applyTextFormat(
                    disp, dispLink, liveDbItem, float(value))

        except ValueError as e:
            # We can't convert the value to int/float
            # Ignore the formatting, it will come good when the value does
            logger.debug("Failed to format |%s| value |%s| to |%s|",
                         liveDbItem.key, value, disp.textFormat)
            disp.text = ""

        logger.warn("DispText %s textFormat=|%s| value=|%s| failed with %s\n"
                    "This can occur if the LiveDbItem.rawValue has not yet been updated",
                    disp.id, disp.textFormat, value, message)


def makeGridKeys(disp, textStyleById: Dict[int, DispTextStyle]):
    if not hasattr(disp, "geomJson"):
        return []

    if disp.geomJson is None:
        logger.critical(disp)

    points = json.loads(disp.geomJson)

    gridKeys = []
    for gridSize in list(GRID_SIZES.values()):
        # CHECK Declutter
        if 0.0 > (min(gridSize.max, (disp.level.maxZoom - 0.00001))
                      - max(gridSize.min, disp.level.minZoom)):
            continue

        if (isinstance(disp, DispText)
            and _isTextTooSmall(disp, gridSize, textStyleById)):
            continue

        # If this is just a point shape/geom, then add it and continue
        if isinstance(disp, DispEllipse):
            minx, miny, maxx, maxy = _calcEllipseBounds(disp, points[0])

        elif len(points) == 1:
            point = points[0]

            # This should be a text
            if not isinstance(disp, DispText):
                logger.debug("TODO Determine size for disp type %s", disp.tupleType())

            # Texts on the boundaries of grids could be a problem
            # They will seem them if the pan over just a little.
            gridKeys.append(makeGridKey(disp.coordSetId,
                                        gridSize,
                                        int(point['x'] / gridSize.xGrid),
                                        int(point['y'] / gridSize.yGrid)))
            continue

        else:
            minx, miny, maxx, maxy = _calcBounds(points)

        # Else, All other shapes



        # Get the bounding box

        # If the size is too small to see at the max zoom, then skip it
        size = math.hypot(maxx - minx, maxy - miny)
        largestSize = size * gridSize.max
        if largestSize < SMALLEST_SHAPE_SIZE:
            continue

        # Round the grid X min/max
        minGridX = int(minx / gridSize.xGrid)
        maxGridX = int(maxx / gridSize.xGrid) + 1

        # Round the grid Y min/max
        minGridY = int(miny / gridSize.yGrid)
        maxGridY = int(maxy / gridSize.yGrid) + 1

        # Iterate through and create the grids.
        for gridX in range(minGridX, maxGridX):
            for gridY in range(minGridY, maxGridY):
                gridKeys.append(makeGridKey(disp.coordSetId, gridSize, gridX, gridY))

    return gridKeys


def _pointToPixel(point: float) -> float:
    return point * 96 / 72


def _isTextTooSmall(disp, gridSize,
                    textStyleById: Dict[int, DispTextStyle]) -> bool:
    """ Is Text Too Small

    This method calculates the size that the text will appear on the diagram at max zoom
    for the provided gird.

    We'll only work this out based on the height

    NOTE: This must match how it's rendered PeekDispRenderDelegateText.ts
    """

    fontStyle = textStyleById[disp.textStyleId]

    fontSize = fontStyle.fontSize * fontStyle.scaleFactor

    lineHeight = _pointToPixel(fontSize)

    if fontStyle.scalable:
        largestSize = lineHeight * gridSize.max
    else:
        largestSize = lineHeight

    return largestSize < SMALLEST_TEXT_SIZE


def _calcEllipseBounds(disp, point):
    """ Calculate the bounds of an ellipse

    """
    # NOTE: To do this accurately we should look at the start and end angles.
    # in the interest simplicity we're not going to.
    # We'll potentially include SMALLEST_SHAPE_SIZE / 2 as well, no big deal.

    x, y = point["x"], point["y"]

    minx = x - disp.xRadius
    maxx = x + disp.xRadius

    miny = y - disp.yRadius
    maxy = y + disp.yRadius

    return minx, miny, maxx, maxy


def _calcBounds(points: List[Dict[str, float]]):
    minx = None
    maxx = None
    miny = None
    maxy = None

    for point in points:
        x, y = point["x"], point["y"]
        if minx is None or x < minx:
            minx = x

        if maxx is None or maxx < x:
            maxx = x

        if miny is None or y < miny:
            miny = y

        if maxy is None or maxy < y:
            maxy = y

    return minx, miny, maxx, maxy
