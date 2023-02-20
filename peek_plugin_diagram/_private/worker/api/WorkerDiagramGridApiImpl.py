import logging
import time
from collections import defaultdict
from textwrap import dedent
from typing import Annotated
from typing import Dict
from typing import List

from sqlalchemy import and_
from sqlalchemy import select
from sqlalchemy import text
from sqlalchemy.sql.functions import min
from vortex.DeferUtil import noMainThread
from vortex.Payload import Payload

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.Display import DispBase
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyIndex
from peek_plugin_diagram._private.storage.GridKeyIndex import (
    GridKeyIndexCompiled,
)
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSetGridSize
from peek_plugin_diagram._private.storage.ModelSet import ModelSet
from peek_plugin_diagram._private.tuples.grid.GridTuple import GridTuple
from peek_plugin_diagram._private.worker.utils.ShapeLookupLinker import (
    ShapeLookupLinker,
)
from peek_plugin_diagram.tuples.grids.DecodedCompiledGridTuple import (
    DecodedCompiledGridTuple,
)
from peek_plugin_diagram.tuples.grids.GridKeyTuple import GridKeyTuple
from peek_plugin_diagram.worker.canvas_shapes.ShapeBase import ShapeBase

logger = logging.getLogger(__name__)


class WorkerDiagramGridApiImpl:
    @classmethod
    def getGridKeys(
        cls,
        modelSetKey: str,
        coordSetKey: str,
        boundingBox: Annotated[List[float], 4] = None,
    ) -> List[GridKeyTuple]:
        session = CeleryDbConn.getDbSession()
        try:
            query = text(
                dedent(
                    f"""
                WITH gridInfo AS (
                    SELECT
                        m1."xGrid" AS "xGrid",
                        m1."yGrid" AS "yGrid",
                        (mcs.id || '|' || m1.key || '.%')::text AS pattern
                    FROM
                        pl_diagram."ModelCoordSetGridSize" AS m1
                        JOIN pl_diagram."ModelCoordSet" AS mcs ON m1."coordSetId" = mcs.id
                        JOIN pl_diagram."ModelSet" AS ms ON ms.id = mcs."modelSetId"
                    WHERE
                        mcs."key" = '{coordSetKey}'
                        AND ms.key = '{modelSetKey}'
                    ORDER BY
                        m1."max" DESC
                    LIMIT 1)
               
                SELECT
                    "gridKey" AS gridKey,
                    (
                        SELECT
                            "xGrid"
                        FROM
                            gridInfo) AS width,
                    (
                        SELECT
                            "yGrid"
                        FROM
                            gridInfo) AS height,
                    count(*) AS shapeCount
                FROM
                    pl_diagram."GridKeyIndex" AS gi
                WHERE
                    gi."gridKey" LIKE (
                        SELECT
                            pattern
                        FROM
                            gridInfo)
                GROUP BY
                    gi."gridKey";
            """
                )
            )

            rows = session.execute(query)

            if boundingBox is not None and len(boundingBox) == 4:
                gridSizeRow = (
                    session.query(ModelCoordSetGridSize)
                    .join(
                        ModelCoordSet,
                        and_(
                            ModelCoordSet.id == ModelCoordSetGridSize.coordSetId
                        ),
                    )
                    .join(
                        ModelSet, and_(ModelSet.id == ModelCoordSet.modelSetId)
                    )
                    .filter(
                        and_(
                            ModelSet.key == modelSetKey,
                            ModelCoordSet.key == coordSetKey,
                        )
                    )
                    .order_by(ModelCoordSetGridSize.max.desc())
                    .first()
                )

                # if we have no shapes in this area of the diagram, then return
                # an array of no grid keys.
                if not gridSizeRow:
                    return []

                xGrid = gridSizeRow.xGrid
                yGrid = gridSizeRow.yGrid

                topLeftX = int(boundingBox[0] / xGrid)
                topLeftY = int(boundingBox[1] / yGrid)
                bottomRightX = int(boundingBox[2] / xGrid)
                bottomRightY = int(boundingBox[3] / yGrid)

            gridKeys = []
            for row in rows:
                _, _, xy = row[0].partition(".")  # gridKey
                x, _, y = xy.partition("x")

                x = int(x)
                y = int(y)

                if (
                    boundingBox is not None
                    and (topLeftX <= x <= bottomRightX)
                    and (topLeftY <= y <= bottomRightY)
                ):
                    g = GridKeyTuple(
                        gridKey=row[0],
                        width=float(row[1]),
                        height=float(row[2]),
                        shapeCount=int(row[3]),
                        modelSetKey=modelSetKey,
                        coordSetKey=coordSetKey,
                    )
                    gridKeys.append(g)
                elif boundingBox is None:
                    gridKeys.append(
                        GridKeyTuple(
                            gridKey=row[0],
                            width=float(row[1]),
                            height=float(row[2]),
                            shapeCount=int(row[3]),
                            modelSetKey=modelSetKey,
                            coordSetKey=coordSetKey,
                        )
                    )

            return gridKeys

        finally:
            session.close()

    @classmethod
    def getShapesByGridKeys(
        cls, gridKeys: List[str]
    ) -> Dict[str, DecodedCompiledGridTuple]:
        """get shapes filtered by grid keys in one query to database

        This guarantees states of all shapes are at the same time

        :param gridKeys: a list of gridKeys in str
        :return: a dict that maps gridKey to a list of DecodedCompiledGridTuple
        """
        s = time.monotonic()
        session = CeleryDbConn.getDbSession()
        try:
            query = session.query(GridKeyIndexCompiled).filter(
                GridKeyIndexCompiled.gridKey.in_(gridKeys)
            )

            rows = query.all()
            decodedCompiledGridTuplesByGridKey = {}

            for row in rows:
                # get encoded chunk and decode it as `Payload`
                gridTuplesPayload: Payload = row.decodedDataBlocking
                # get the GridTuple from Payload
                gridTuple: GridTuple = gridTuplesPayload.tuples[0]

                decodedCompiledGridTuplesByGridKey[
                    gridTuple.gridKey
                ] = gridTuple.toDecodedCompiledGridTuple()

            return decodedCompiledGridTuplesByGridKey
        finally:
            session.close()

    @classmethod
    def linkShapes(
        cls,
        decodedCompiledGridTuplesByGridKey: Dict[str, DecodedCompiledGridTuple],
    ):
        shapeLookupLinker = ShapeLookupLinker()
        shapeLookupLinker.loadLookups()

        for (
            gridKey,
            decodedCompiledGridTuple,
        ) in decodedCompiledGridTuplesByGridKey.items():
            shapeLookupLinker.linkShapesToLookups(
                decodedCompiledGridTuple.shapes
            )

    @classmethod
    def compileShapes(
        cls,
        decodedCompiledGridTuples,
        levelsOrderedByOrder,
        layersOrderedByOrder,
    ):
        """an equivalent of PeekCanvasModel._compileDisps()

        :param decodedCompiledGridTuples: a list of decodedCompiledGridTuples
                which contains compiled shapes in a grid
        :param levelsOrderedByOrder: a list of levels already ordered by
        tuplefield `order`
        :param layersOrderedByOrder: a list of layers already ordered by
        tuplefield `order`
        :return: a list of dicts of shapes that are ready for factory renderer
        """
        # levelsOrderedByOrder = cls._getLevelsOrderedByOrder(
        #     coordSetKey=coordSetKey
        # )
        #
        # layersOrderedByOrder = cls._getLayersOrderedByOrder(
        #     modelSetKey=modelSetKey
        # )

        dispIndexByGridKey = defaultdict(int)
        disps = []
        for level in levelsOrderedByOrder:
            for layer in layersOrderedByOrder:
                if not layer.visible:
                    continue

                for decodedCompiledGridTuple in decodedCompiledGridTuples:
                    gridKey = decodedCompiledGridTuple.gridKey

                    # default is 0 if key doesn't exist
                    nextIndex = dispIndexByGridKey[gridKey]

                    shapes = decodedCompiledGridTuple.shapes

                    if nextIndex >= len(shapes):
                        continue

                    # while nextIndex < len(shapes):
                    for i in range(nextIndex, len(shapes), 1):
                        nextIndex = i

                        shape = shapes[i]

                        # for idx, shape in enumerate(shapes):
                        # Level first, as per the sortDisps function
                        shapeLevel = ShapeBase.level(shape)

                        if shapeLevel.order < level.order:
                            continue

                        if level.order < shapeLevel.order:
                            break

                        # Then Layer
                        shapeLayer = ShapeBase.layer(shape)
                        if shapeLayer.order < layer.order:
                            continue

                        if layer.order < shapeLayer.order:
                            break

                        disps.append(shape)

                    dispIndexByGridKey[gridKey] = nextIndex

        return disps

    @classmethod
    def getGridKeysFromShapeKeys(
        cls, modelSetKey, coordSetKey, shapeKeys, smallestGridKeySize=False
    ):
        noMainThread()

        gridKeyIndexTable = GridKeyIndex.__table__
        dispBaseTable = DispBase.__table__

        # Ensure there are no duplicate keys or empty keys
        shapeKeys = list(set(filter(lambda k: k, shapeKeys)))

        ormSession = CeleryDbConn.getDbSession()
        try:
            coordSetId = (
                ormSession.query(ModelCoordSet.id)
                .filter(
                    ModelCoordSet.key == coordSetKey
                    and ModelCoordSet.modelSet.key == modelSetKey
                )
                .scalar()
            )

            gridKeysSet = set()
            # Start a transaction so we have consistent results.
            CHUNK_SIZE = 1000

            for i in range(0, len(shapeKeys), CHUNK_SIZE):
                chunkedShapeKeys = shapeKeys[i : i + CHUNK_SIZE]
                sql = (
                    select([gridKeyIndexTable.c.gridKey])
                    .select_from(
                        gridKeyIndexTable.join(
                            dispBaseTable,
                            dispBaseTable.c.id == gridKeyIndexTable.c.dispId,
                        )
                    )
                    .where(dispBaseTable.c.key.in_(chunkedShapeKeys))
                    .distinct()
                )

                newGridKeys = [r.gridKey for r in ormSession.execute(sql)]

                gridKeysSet.update(newGridKeys)

            if not smallestGridKeySize:
                return list(gridKeysSet)

            minKey = (
                ormSession.query(min(ModelCoordSetGridSize.key))
                .filter(ModelCoordSetGridSize.coordSetId == coordSetId)
                .one()
            )

            startsWithStr = ModelCoordSetGridSize.makeGridKeyStartsWith(
                coordSetId, minKey
            )

            return list(
                filter(
                    lambda gridKey: gridKey.startswith(startsWithStr),
                    gridKeysSet,
                )
            )

        finally:
            ormSession.close()
