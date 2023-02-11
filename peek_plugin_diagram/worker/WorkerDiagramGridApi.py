from typing import Annotated
from typing import Dict
from typing import List

from vortex.Tuple import Tuple


class WorkerDiagramGridApi:
    @classmethod
    def getGridKeys(
        cls,
        modelSetKey: str,
        coordSetKey: str,
        boundingBox: Annotated[List[float], 4] = None,
    ):
        from peek_plugin_diagram._private.worker.api.WorkerDiagramGridApiImpl import (
            WorkerDiagramGridApiImpl,
        )

        return WorkerDiagramGridApiImpl.getGridKeys(
            modelSetKey=modelSetKey,
            coordSetKey=coordSetKey,
            boundingBox=boundingBox,
        )

    @classmethod
    def getShapesByGridKeys(cls, gridKeys) -> Dict[str, Tuple]:
        from peek_plugin_diagram._private.worker.api.WorkerDiagramGridApiImpl import (
            WorkerDiagramGridApiImpl,
        )

        return WorkerDiagramGridApiImpl.getShapesByGridKeys(gridKeys=gridKeys)

    @classmethod
    def linkShapes(cls, decodedCompiledGridTuplesByGridKey: Dict):
        from peek_plugin_diagram._private.worker.api.WorkerDiagramGridApiImpl import (
            WorkerDiagramGridApiImpl,
        )

        return WorkerDiagramGridApiImpl.linkShapes(
            decodedCompiledGridTuplesByGridKey
        )

    @classmethod
    def compileShapes(
        cls,
        decodedCompiledGridTuples: List,
        levelsOrderedByOrder,
        layersOrderedByOrder,
    ):
        from peek_plugin_diagram._private.worker.api.WorkerDiagramGridApiImpl import (
            WorkerDiagramGridApiImpl,
        )

        return WorkerDiagramGridApiImpl.compileShapes(
            decodedCompiledGridTuples=decodedCompiledGridTuples,
            levelsOrderedByOrder=levelsOrderedByOrder,
            layersOrderedByOrder=layersOrderedByOrder,
        )
