from typing import Union

from twisted.internet.defer import Deferred

from txhttputil.util.DeferUtil import deferToThreadWrap
from vortex.Payload import Payload
from vortex.Tuple import TUPLE_TYPES_BY_NAME
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TuplesProviderABC


class ServerLookupTupleProvider(TuplesProviderABC):
    def __init__(self, ormSessionCreator):
        self._ormSessionCreator = ormSessionCreator

    @deferToThreadWrap
    def makeVortexMsg(self, filt: dict,
                      tupleSelector: TupleSelector) -> Union[Deferred, bytes]:
        lookupTupleName = tupleSelector.selector["lookupTupleName"]

        session = self._ormSessionCreator()
        try:
            Lookup = TUPLE_TYPES_BY_NAME[lookupTupleName]
            all = session.query(Lookup).all()
            return Payload(filt, tuples=all).toVortexMsg()

        finally:
            session.close()
