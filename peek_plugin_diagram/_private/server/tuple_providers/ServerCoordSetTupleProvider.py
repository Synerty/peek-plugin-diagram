from typing import Union

from twisted.internet.defer import Deferred

from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from txhttputil.util.DeferUtil import deferToThreadWrap
from vortex.Payload import Payload
from vortex.TupleSelector import TupleSelector
from vortex.handler.TupleDataObservableHandler import TuplesProviderABC


class ServerCoordSetTupleProvider(TuplesProviderABC):
    def __init__(self, ormSessionCreator):
        self._ormSessionCreator = ormSessionCreator

    @deferToThreadWrap
    def makeVortexMsg(self, filt: dict,
                      tupleSelector: TupleSelector) -> Union[Deferred, bytes]:

        session = self._ormSessionCreator()
        try:
            all = session.query(ModelCoordSet).all()
            return Payload(filt, tuples=all).toVortexMsg()

        finally:
            session.close()
