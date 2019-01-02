from vortex.handler.TupleActionProcessor import TupleActionProcessor

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.PluginNames import diagramActionProcessorName
from peek_plugin_diagram._private.server.controller.BranchUpdateController import \
    BranchUpdateController
from peek_plugin_diagram._private.tuples.branch.BranchUpdateTupleAction import \
    BranchUpdateTupleAction
from .controller.StatusController import StatusController


def makeTupleActionProcessorHandler(statusController: StatusController,
                                    branchUpdateController: BranchUpdateController):
    processor = TupleActionProcessor(
        tupleActionProcessorName=diagramActionProcessorName,
        additionalFilt=diagramFilt,
        defaultDelegate=statusController)

    processor.setDelegate(BranchUpdateTupleAction.tupleName(), branchUpdateController)
    return processor
