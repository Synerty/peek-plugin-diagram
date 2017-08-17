import logging

from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet, ModelSet
from peek_plugin_diagram.server.DiagramViewerApiABC import DiagramViewerApiABC
from peek_plugin_diagram.tuples.model.DiagramCoordSetTuple import DiagramCoordSetTuple
from vortex.DeferUtil import deferToThreadWrapWithLogger

logger = logging.getLogger(__name__)


class DiagramViewerApi(DiagramViewerApiABC):
    def __init__(self, ormSessionCreator):
        self._ormSessionCreator = ormSessionCreator

    def shutdown(self):
        pass

    @deferToThreadWrapWithLogger(logger)
    def getCoordSets(self, modelSetName: str):
        ormSession = self._ormSessionCreator()
        try:
            all = (ormSession.query(ModelCoordSet)
                   .join(ModelSet)
                   .filter(ModelSet.name == modelSetName)
                   .all())

            coordSetTuples = []
            for obj in all:
                coordSetTuples.append(DiagramCoordSetTuple(
                    id=obj.id,
                    name=obj.name
                ))

            return coordSetTuples

        finally:
            ormSession.close()
