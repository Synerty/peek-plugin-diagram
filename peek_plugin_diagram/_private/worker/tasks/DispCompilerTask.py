import logging
import math
from _collections import defaultdict
from collections import namedtuple
from datetime import datetime

from geoalchemy2.shape import to_shape
from vortex.SerialiseUtil import convertFromShape

from peek_plugin_diagram._private.storage.Display import DispBase, DispText
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyIndex, DispIndexerQueue
from peek_plugin_diagram._private.storage.LiveDb import LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR, LiveDbKey
from peek_plugin_diagram._private.GridKeyUtil import GRID_SIZES, makeGridKey
from peek_plugin_base.worker import CeleryDbConn
from shapely.geometry.point import Point
from sqlalchemy.orm import subqueryload
from sqlalchemy.sql.selectable import Select
from txcelery.defer import CeleryClient

from peek_plugin_diagram._private.worker.CeleryApp import celeryApp

logger = logging.getLogger(__name__)

CoordSetIdGridKeyTuple = namedtuple("CoordSetIdGridKeyTuple", ["coordSetId", "gridKey"])
DispData = namedtuple('DispData', ['json', 'levelOrder', 'layerOrder'])


class DispCompilerTask:
    """ Grid Compiler

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue
    """

    def compileDisps(self, lastQueueId, queueDispIds):

        startTime = datetime.utcnow()

        # from proj.DbConnection import Session, dbEngine

        session = CeleryDbConn.getDbSession()
        conn = CeleryDbConn.getDbEngine()

        dispBaseTable = DispBase.__table__
        queueTable = DispIndexerQueue.__table__
        gridTable = GridKeyIndex.__table__

        # -----
        # Begin the DISP merge from live data
        dispsQry = (session.query(DispBase)
                    .options(subqueryload(DispBase.liveDbLinks)
                             .subqueryload("liveDbKey"),
                             subqueryload(DispBase.level))
                    .filter(DispBase.id.in_(queueDispIds)))

        # print dispsQry

        dispsAll = dispsQry.all()

        logger.debug("Loaded %s disp objects in %s",
                     len(dispsAll), (datetime.utcnow() - startTime))

        # List of type CoordSetIdGridKeyTuple
        gridCompiledQueueItems = set()

        # GridKeyIndexes to insert
        gridKeyIndexesByDispId = defaultdict(list)

        for disp in dispsQry:
            # Apply live db links
            self._mergeInLiveDbValues(disp)

            # Deflate to json
            disp.dispJson = disp.tupleToSmallJsonDict()

            for gridKey in self.makeGridKeys(disp):
                gridCompiledQueueItems.add(
                    CoordSetIdGridKeyTuple(coordSetId=disp.coordSetId,
                                           gridKey=gridKey))

                gridKeyIndexesByDispId[disp.id].append(
                    dict(dispId=disp.id,
                         coordSetId=disp.coordSetId,
                         gridKey=gridKey,
                         importGroupHash=disp.importGroupHash))

        logger.debug("Updated %s disp objects in %s",
                     len(dispsAll), (datetime.utcnow() - startTime))

        try:
            session.commit()
            logger.debug("Committed %s disp objects in %s",
                         len(dispsAll), (datetime.utcnow() - startTime))

        except Exception as e:
            session.rollback()
            logger.critical(e)

        finally:
            session.close()

        # -----
        # Begin the GridKeyIndex updates

        transaction = conn.begin()
        lockedDispIds = conn.execute(Select(
            whereclause=dispBaseTable.c.id.in_(queueDispIds),
            columns=[dispBaseTable.c.id],
            for_update=True))

        # Ensure that the Disps exist, otherwise we get an integrity error.
        gridKeyIndexes = []
        for dispId, in lockedDispIds:
            gridKeyIndexes.extend(gridKeyIndexesByDispId[dispId])

        conn.execute(gridTable.delete(gridTable.c.dispId.in_(queueDispIds)))
        if gridKeyIndexes:
            conn.execute(gridTable.insert(), gridKeyIndexes)
        conn.execute(queueTable.delete(queueTable.c.id <= lastQueueId))

        gridKeyQueueCompiler.queueGrids(gridCompiledQueueItems, conn)

        try:
            transaction.commit()
            logger.debug("Committed %s GridKeyIndex in %s",
                         len(gridKeyIndexes), (datetime.utcnow() - startTime))

        except Exception as e:
            transaction.rollback()
            logger.critical(e)

        finally:
            conn.close()

    def _mergeInLiveDbValues(self, disp):
        for dispLink in disp.liveDbLinks:
            self._mergeInLiveDbValue(disp, dispLink)

    def _mergeInLiveDbValue(self, disp, dispLink, value=None):
        # This allows us to change the value and use recursion a little
        # (Value is converted to different data types and recursively called, see below)
        if value is None:
            value = dispLink.liveDbKey.convertedValue

        # At least for colors :
        # If the color vale is None, set the attribute to None as well
        # At this stage we don't expect other data types to be None
        if value is None:
            keyType = LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR[dispLink.dispAttrName]
            assert keyType == LiveDbKey.COLOR
            setattr(disp, dispLink.dispAttrName, None)
            return

        # ----------------------------
        # Special case for Text
        if isinstance(disp, DispText) and dispLink.dispAttrName == "text":
            if disp.textFormat:
                try:
                    disp.text = (disp.textFormat % value)

                except TypeError as e:
                    message = str(e)
                    # Lazy format type detection
                    try:
                        if "number is required" in message:
                            return self._mergeInLiveDbValue(disp, dispLink, int(value))

                        if "invalid literal for int" in message:
                            return self._mergeInLiveDbValue(disp, dispLink, int(value))

                        if "float is required" in message:
                            return self._mergeInLiveDbValue(disp, dispLink, float(value))

                        if "could not convert string to float" in message:
                            return self._mergeInLiveDbValue(disp, dispLink, float(value))

                    except ValueError as e:
                        # We can't convert the value to int/float
                        # Ignore the formatting, it will come good when the value does
                        logger.debug("Failed to format |%s| value |%s| to |%s|",
                                     dispLink.liveDbKey.liveDbKey, value, disp.textFormat)
                        disp.text = ""

                    logger.warn("DispText %s textFormat=|%s| failed with %s",
                                disp.id, disp.textFormat, message)
            else:
                disp.text = value

            return

        # ----------------------------
        # All others
        setattr(disp, dispLink.dispAttrName, value)

    @classmethod
    def makeGridKeys(cls, disp):
        if not hasattr(disp, "geom"):
            return []

        if disp.geom is None:
            logger.critical(disp)

        shape = to_shape(disp.geom)

        gridKeys = []
        for gridSize in list(GRID_SIZES.values()):
            # CHECK Declutter
            if 0.0 > (min(gridSize.max, (disp.level.maxZoom - 0.00001))
                        - max(gridSize.min, disp.level.minZoom)):
                continue

            # If this is just a point shape/geom, then add it and continue
            if isinstance(shape, Point):
                points = convertFromShape(shape)
                assert len(points) == 1, "This condition is only for a single point"
                point = points[0]
                gridKeys.append(makeGridKey(disp.coordSetId,
                                            gridSize,
                                            int(point['x'] / gridSize.xGrid),
                                            int(point['y'] / gridSize.yGrid)))
                continue

            # Else, All other shapes

            # Get the bounding box
            minx, miny, maxx, maxy = shape.bounds

            # If the size is too small to see at the max zoom, then skip it
            size = math.hypot(maxx - minx, maxy - miny)
            largestSize = size * gridSize.max
            if largestSize < 2.0:
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


dispQueueCompilerTask = DispCompilerTask()

@CeleryClient
@celeryApp.task
def compileDisps(lastQueueId, queueDispIds):
    dispQueueCompilerTask.compileDisps(lastQueueId, queueDispIds)
