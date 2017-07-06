from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.PluginNames import diagramObservableName
from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from peek_plugin_diagram._private.server.tuple_providers.DiagramLoaderStatusTupleProvider import \
    DiagramLoaderStatusTupleProvider
from peek_plugin_diagram._private.tuples.DiagramLoaderStatusTuple import \
    DiagramLoaderStatusTuple
from vortex.handler.TupleDataObservableHandler import TupleDataObservableHandler


def makeTupleDataObservableHandler(statusController: StatusController):
    """" Make Tuple Data Observable Handler

    This method creates the observable object, registers the tuple providers and then
    returns it.

    :param statusController: The status controller
    :return: An instance of :code:`TupleDataObservableHandler`

    """
    tupleObservable = TupleDataObservableHandler(
        observableName=diagramObservableName,
        additionalFilt=diagramFilt)

    # Register TupleProviders here
    tupleObservable.addTupleProvider(DiagramLoaderStatusTuple.tupleName(),
                                     DiagramLoaderStatusTupleProvider(statusController))

    return tupleObservable
