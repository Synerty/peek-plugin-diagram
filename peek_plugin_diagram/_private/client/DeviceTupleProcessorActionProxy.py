from peek_plugin_base.PeekVortexUtil import peekServerName
from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.PluginNames import diagramActionProcessorName
from vortex.handler.TupleActionProcessorProxy import TupleActionProcessorProxy


def makeTupleActionProcessorProxy():
    return TupleActionProcessorProxy(
                tupleActionProcessorName=diagramActionProcessorName,
                proxyToVortexName=peekServerName,
                additionalFilt=diagramFilt)
