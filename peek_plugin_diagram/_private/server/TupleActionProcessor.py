from vortex.handler.TupleActionProcessor import TupleActionProcessor

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.PluginNames import diagramActionProcessorName
from .controller.StatusController import StatusController


def makeTupleActionProcessorHandler(mainController: StatusController):
    processor = TupleActionProcessor(
        tupleActionProcessorName=diagramActionProcessorName,
        additionalFilt=diagramFilt,
        defaultDelegate=mainController)
    return processor
