from typing import Dict
from typing import List
from typing import Optional

from vortex.Payload import Payload
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TupleDataObservableHandler
from vortex.handler.TupleDataObserverClient import TupleDataObserverClient

from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet


class CoordSetCacheController:
    """Lookup Cache Controller

    This class caches the lookups in each client.

    """

    def __init__(self, tupleObserver: TupleDataObserverClient):
        self._tupleObserver = tupleObserver
        self._tupleObservable = None

        #: This stores the cache of grid data for the clients
        self._coordSetCache: Dict[int, ModelCoordSet] = {}

        self._vortexMsgCache = None

    def setTupleObservable(self, tupleObservable: TupleDataObservableHandler):
        self._tupleObservable = tupleObservable

    def start(self):
        (
            self._tupleObserver.subscribeToTupleSelector(
                TupleSelector(ModelCoordSet.tupleName(), {})
            ).subscribe(self._processNewTuples)
        )

    def shutdown(self):
        self._tupleObservable = None
        self._tupleObserver = None
        self._coordSetCache = {}
        self._vortexMsgCache = None

    def _processNewTuples(self, coordSetTuples):
        if not coordSetTuples:
            return

        self._coordSetCache = {c.id: c for c in coordSetTuples}

        self._vortexMsgCache = None

        self._tupleObservable.notifyOfTupleUpdate(
            TupleSelector(ModelCoordSet.tupleName(), {})
        )

    @property
    def coordSets(self) -> List[ModelCoordSet]:
        return list(self._coordSetCache.values())

    def coordSetForId(self, coordSetId: int) -> Optional[ModelCoordSet]:
        return self._coordSetCache.get(coordSetId)

    def cachedVortexMsgBlocking(self, filt: dict) -> bytes:
        if self._vortexMsgCache:
            return self._vortexMsgCache

        data = self.coordSets

        # Create the vortex message
        vortexMsg = (
            Payload(filt, tuples=data).makePayloadEnvelope().toVortexMsg()
        )
        self._vortexMsgCache = vortexMsg
        return vortexMsg
