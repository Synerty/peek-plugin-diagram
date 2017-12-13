from peek_plugin_diagram._private.client.controller.CoordSetCacheController import \
    CoordSetCacheController
from peek_plugin_diagram._private.client.controller.GridCacheController import \
    GridCacheController
from peek_plugin_diagram._private.client.controller.LookupCacheController import \
    LookupCacheController
from peek_plugin_diagram._private.client.tuple_providers.ClientCoordSetTupleProvider import \
    ClientCoordSetTupleProvider
from peek_plugin_diagram._private.client.tuple_providers.ClientLookupTupleProvider import \
    ClientLookupTupleProvider
from peek_plugin_diagram._private.client.tuple_providers.GridCacheIndexTupleProvider import \
    GridCacheIndexTupleProvider
from peek_plugin_diagram._private.storage.Display import DispLevel, DispTextStyle, \
    DispLineStyle, DispColor, DispLayer
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.tuples.GridCacheIndexTuple import GridCacheIndexTuple
from vortex.handler.TupleDataObservableProxyHandler import TupleDataObservableProxyHandler


def makeClientTupleDataObservableHandler(
        tupleObservable: TupleDataObservableProxyHandler,
        coordSetCacheController: CoordSetCacheController,
        gridCacheController: GridCacheController,
        lookupCacheController: LookupCacheController):
    """" Make CLIENT Tuple Data Observable Handler

    This method creates the observable object, registers the tuple providers and then
    returns it.

    :param tupleObservable: The tuple observable proxy
    :param coordSetCacheController: The clients coord set cache controller
    :param gridCacheController: The cache controller for the grid
    :param lookupCacheController: The clients lookup cache controller
    :return: An instance of :code:`TupleDataObservableHandler`

    """
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

    tupleObservable.addTupleProvider(GridCacheIndexTuple.tupleName(),
                                     GridCacheIndexTupleProvider(gridCacheController))

    return tupleObservable
