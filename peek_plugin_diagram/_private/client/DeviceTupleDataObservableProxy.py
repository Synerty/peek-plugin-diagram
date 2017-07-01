from peek_plugin_base.PeekVortexUtil import peekServerName
from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.PluginNames import diagramObservableName
from vortex.handler.TupleDataObservableProxyHandler import TupleDataObservableProxyHandler


def makeDeviceTupleDataObservableProxy():
    return TupleDataObservableProxyHandler(observableName=diagramObservableName,
                                           proxyToVortexName=peekServerName,
                                           additionalFilt=diagramFilt)
