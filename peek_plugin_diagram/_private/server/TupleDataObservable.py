from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.PluginNames import diagramObservableName
from peek_plugin_diagram._private.server.controller.StatusController import \
    StatusController
from peek_plugin_diagram._private.server.tuple_providers.ServerCoordSetTupleProvider import \
    ServerCoordSetTupleProvider
from peek_plugin_diagram._private.server.tuple_providers.DiagramLoaderStatusTupleProvider import \
    DiagramLoaderStatusTupleProvider
from peek_plugin_diagram._private.server.tuple_providers.ServerLookupTupleProvider import \
    ServerLookupTupleProvider
from peek_plugin_diagram._private.storage.Display import DispLevel, DispLayer, DispColor, \
    DispLineStyle, DispTextStyle
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.tuples.DiagramLoaderStatusTuple import \
    DiagramLoaderStatusTuple
from vortex.handler.TupleDataObservableHandler import TupleDataObservableHandler


def makeTupleDataObservableHandler(ormSessionCreator,
                                   statusController: StatusController):
    """" Make Tuple Data Observable Handler

    This method creates the observable object, registers the tuple providers and then
    returns it.

    :param ormSessionCreator: A callable that returns an SQLAlchemy session
    :param statusController: The status controller
    :return: An instance of :code:`TupleDataObservableHandler`

    """
    tupleObservable = TupleDataObservableHandler(
        observableName=diagramObservableName,
        additionalFilt=diagramFilt)

    # Register TupleProviders here
    tupleObservable.addTupleProvider(DiagramLoaderStatusTuple.tupleName(),
                                     DiagramLoaderStatusTupleProvider(statusController))

    # Register TupleProviders here
    tupleObservable.addTupleProvider(ModelCoordSet.tupleName(),
                                     ServerCoordSetTupleProvider(ormSessionCreator))

    # Register TupleProviders here
    lookupTupleProvider = ServerLookupTupleProvider(ormSessionCreator)
    tupleObservable.addTupleProvider(DispLevel.tupleName(), lookupTupleProvider)
    tupleObservable.addTupleProvider(DispLayer.tupleName(), lookupTupleProvider)
    tupleObservable.addTupleProvider(DispColor.tupleName(), lookupTupleProvider)
    tupleObservable.addTupleProvider(DispLineStyle.tupleName(), lookupTupleProvider)
    tupleObservable.addTupleProvider(DispTextStyle.tupleName(), lookupTupleProvider)

    return tupleObservable
