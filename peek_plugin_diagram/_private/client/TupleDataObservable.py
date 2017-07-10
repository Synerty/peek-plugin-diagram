from peek_plugin_diagram._private.client.tuple_providers.ClientLookupTupleProvider import \
    ClientLookupTupleProvider

from peek_plugin_diagram._private.PluginNames import diagramFilt, \
    diagramClientObservableName
from peek_plugin_diagram._private.client.controller.CoordSetCacheController import \
    CoordSetCacheController
from peek_plugin_diagram._private.client.controller.LookupCacheController import \
    LookupCacheController
from peek_plugin_diagram._private.client.tuple_providers.ClientCoordSetTupleProvider import \
    ClientCoordSetTupleProvider
from peek_plugin_diagram._private.storage.Display import DispLevel, DispTextStyle, \
    DispLineStyle, DispColor, DispLayer
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from vortex.handler.TupleDataObservableHandler import TupleDataObservableHandler


def makeClientTupleDataObservableHandler(
        coordSetCacheController: CoordSetCacheController,
        lookupCacheController: LookupCacheController):
    """" Make CLIENT Tuple Data Observable Handler

    This method creates the observable object, registers the tuple providers and then
    returns it.

    :param coordSetCacheController: The clients coord set cache controller
    :param lookupCacheController: The clients lookup cache controller
    :return: An instance of :code:`TupleDataObservableHandler`

    """
    tupleObservable = TupleDataObservableHandler(
        observableName=diagramClientObservableName,
        additionalFilt=diagramFilt)

    # Register TupleProviders here
    lookupTupleProvider = ClientLookupTupleProvider(lookupCacheController)

    # Add the lookup providers
    tupleObservable.addTupleProvider(DispLevel.tupleName(), lookupTupleProvider)
    tupleObservable.addTupleProvider(DispLayer.tupleName(), lookupTupleProvider)
    tupleObservable.addTupleProvider(DispColor.tupleName(), lookupTupleProvider)
    tupleObservable.addTupleProvider(DispLineStyle.tupleName(), lookupTupleProvider)
    tupleObservable.addTupleProvider(DispTextStyle.tupleName(), lookupTupleProvider)

    # Add the CoordSet providers

    tupleObservable.addTupleProvider(ModelCoordSet.tupleName(),
                                     ClientCoordSetTupleProvider(coordSetCacheController))

    return tupleObservable
