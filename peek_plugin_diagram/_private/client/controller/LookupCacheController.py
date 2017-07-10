from typing import List, Iterable

from twisted.internet.defer import inlineCallbacks

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.server.client_handlers.RpcForClient import RpcForClient
from peek_plugin_diagram._private.storage.Display import DispLevel, DispTextStyle, \
    DispLayer, DispColor, DispLineStyle
from vortex.Payload import Payload
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TupleDataObservableHandler
from vortex.handler.TupleDataObserverClient import TupleDataObserverClient

lookupCachePayloadFilt = dict(key="client.lookup.update")
lookupCachePayloadFilt.update(diagramFilt)


class LookupCacheController:
    """ Lookup Cache Controller

    This class caches the lookups in each client.

    """
    #: This stores the cache of grid data for the clients
    _levelLookups: List[DispLevel] = None
    _layerLookups: List[DispLayer] = None
    _colorLookups: List[DispColor] = None
    _lineStyleLookups: List[DispLineStyle] = None
    _textStyleLookups: List[DispTextStyle] = None

    def __init__(self, tupleObserver: TupleDataObserverClient):
        self._tupleObserver = tupleObserver
        self._tupleObservable = None

    def setTupleObserable(self, tupleObservable: TupleDataObservableHandler):
        self._tupleObservable = tupleObservable

    def start(self):
        (self._tupleObserver
         .subscribeToTupleSelector(TupleSelector(DispLevel.tupleName(), {}))
         .subscribe(self._processNewTuples))

        (self._tupleObserver
         .subscribeToTupleSelector(TupleSelector(DispLayer.tupleName(), {}))
         .subscribe(self._processNewTuples))

        (self._tupleObserver
         .subscribeToTupleSelector(TupleSelector(DispColor.tupleName(), {}))
         .subscribe(self._processNewTuples))

        (self._tupleObserver
         .subscribeToTupleSelector(TupleSelector(DispLineStyle.tupleName(), {}))
         .subscribe(self._processNewTuples))

        (self._tupleObserver
         .subscribeToTupleSelector(TupleSelector(DispTextStyle.tupleName(), {}))
         .subscribe(self._processNewTuples))

    def shutdown(self):
        self._tupleObservable = None
        self._tupleObserver = None

        self._levelLookups = []
        self._layerLookups = []
        self._colorLookups = []
        self._lineStyleLookups = []
        self._textStyleLookups = []

    def _processNewTuples(self, lookupTuples):

        if not lookupTuples:
            return

        firstTuple = lookupTuples[0].tupleType()
        if DispLevel.isSameTupleType(firstTuple):
            self._levelLookups = lookupTuples

        elif DispLayer.isSameTupleType(firstTuple):
            self._layerLookups = lookupTuples

        elif DispLayer.isSameTupleType(firstTuple):
            self._colorLookups = lookupTuples

        elif DispLayer.isSameTupleType(firstTuple):
            self._lineStyleLookups = lookupTuples

        elif DispLayer.isSameTupleType(firstTuple):
            self._textStyleLookups = lookupTuples

        else:
            raise NotImplementedError(
                "Cache not implemented for %s" % firstTuple.tupleName())

        self._tupleObservable.notifyOfTupleUpdate(
            TupleSelector(firstTuple.tupleName(), {})
        )

    def lookups(self, lookupTupleType) -> Iterable:
        if DispLevel.tupleName() == lookupTupleType:
            return iter(self._levelLookups)

        elif DispLayer.tupleName() == lookupTupleType:
            return iter(self._layerLookups)

        elif DispLayer.tupleName() == lookupTupleType:
            return iter(self._colorLookups)

        elif DispLayer.tupleName() == lookupTupleType:
            return iter(self._lineStyleLookups)

        elif DispLayer.tupleName() == lookupTupleType:
            return iter(self._textStyleLookups)

        else:
            raise NotImplementedError(
                "Cache not implemented for %s" % lookupTupleType.tupleName())
