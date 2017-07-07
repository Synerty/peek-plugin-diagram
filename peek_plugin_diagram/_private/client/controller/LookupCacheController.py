from typing import List, Iterable

from twisted.internet.defer import inlineCallbacks

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.server.client_handlers.RpcForClient import RpcForClient
from peek_plugin_diagram._private.storage.Display import DispLevel, DispTextStyle, \
    DispLayer, DispColor, DispLineStyle
from vortex.Payload import Payload
from vortex.PayloadEndpoint import PayloadEndpoint
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TupleDataObservableHandler

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

    def __init__(self):
        self._tupleObservable = None
        self._gridCache = {}

        self._lookupEndpoint = None

    def setTupleObserable(self, tupleObservable: TupleDataObservableHandler):
        self._tupleObservable = tupleObservable

    @inlineCallbacks
    def start(self):
        self._lookupEndpoint = PayloadEndpoint(lookupCachePayloadFilt,
                                               self._processPayload)

        self._levelLookups = yield RpcForClient.loadLookups(DispLevel.tupleName())
        self._layerLookups = yield RpcForClient.loadLookups(DispLayer.tupleName())
        self._colorLookups = yield RpcForClient.loadLookups(DispColor.tupleName())
        self._lineStyleLookups = yield RpcForClient.loadLookups(DispLineStyle.tupleName())
        self._textStyleLookups = yield RpcForClient.loadLookups(DispTextStyle.tupleName())

    def shutdown(self):
        self._tupleObservable = None
        self._lookupEndpoint.shutdown()
        self._lookupEndpoint = None

        self._levelLookups = []
        self._layerLookups = []
        self._colorLookups = []
        self._lineStyleLookups = []
        self._textStyleLookups = []

    def _processPayload(self, payload: Payload, **kwargs):
        lookupTuples = payload.tuples

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
