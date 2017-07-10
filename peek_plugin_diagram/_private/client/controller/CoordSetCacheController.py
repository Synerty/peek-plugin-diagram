from typing import List, Iterable

from copy import copy
from twisted.internet.defer import inlineCallbacks

from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from vortex.Payload import Payload
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TupleDataObservableHandler
from vortex.handler.TupleDataObserverClient import TupleDataObserverClient


class CoordSetCacheController:
    """ Lookup Cache Controller

    This class caches the lookups in each client.

    """
    #: This stores the cache of grid data for the clients
    _coordSetCache: List[ModelCoordSet] = None

    def __init__(self, tupleObserver: TupleDataObserverClient):
        self._tupleObserver = tupleObserver
        self._tupleObservable = None

    def setTupleObserable(self, tupleObservable: TupleDataObservableHandler):
        self._tupleObservable = tupleObservable

    def start(self):
        (self._tupleObserver
         .subscribeToTupleSelector(TupleSelector(ModelCoordSet.tupleName(), {}))
         .subscribe(self._processNewTuples))

    def shutdown(self):
        self._tupleObservable = None
        self._tupleObserver = None
        self._coordSetCache = []

    def _processNewTuples(self, coordSetTuples):

        if not coordSetTuples:
            return

        self._coordSetCache = coordSetTuples

        self._tupleObservable.notifyOfTupleUpdate(
            TupleSelector(ModelCoordSet.tupleName(), {})
        )

    @property
    def coordSets(self) -> List[ModelCoordSet]:
        return copy(self._coordSetCache)
