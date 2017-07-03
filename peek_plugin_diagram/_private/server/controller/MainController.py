import logging

from twisted.internet.defer import Deferred
from txhttputil.util.DeferUtil import deferToThreadWrap

from vortex.TupleSelector import TupleSelector
from vortex.TupleAction import TupleActionABC
from vortex.handler.TupleActionProcessor import TupleActionProcessorDelegateABC
from vortex.handler.TupleDataObservableHandler import TupleDataObservableHandler

from peek_plugin_diagram._private.tuples.AddIntValueActionTuple import AddIntValueActionTuple
from peek_plugin_diagram._private.tuples.StringCapToggleActionTuple import StringCapToggleActionTuple

logger = logging.getLogger(__name__)


class MainController(TupleActionProcessorDelegateABC):
    def __init__(self, dbSessionCreator, tupleObservable: TupleDataObservableHandler):
        self._dbSessionCreator = dbSessionCreator
        self._tupleObservable = tupleObservable

    def shutdown(self):
        pass

    def processTupleAction(self, tupleAction: TupleActionABC) -> Deferred:

        # if isinstance(tupleAction, AddIntValueActionTuple):
        #     return self._processAddIntValue(tupleAction)

        raise NotImplementedError(tupleAction.tupleName())


    # @deferToThreadWrap
    # def _processAddIntValue(self, action: AddIntValueActionTuple):
    #     try:
    #         # Perform update using SQLALchemy
    #         session = self._dbSessionCreator()
    #         row = (session.query(StringIntTuple)
    #                .filter(StringIntTuple.id == action.stringIntId)
    #                .one())
    #         row.int1 += action.offset
    #         session.commit()
    #
    #         logger.debug("Int changed by %u", action.offset)
    #
    #         # Notify the observer of the update
    #         # This tuple selector must exactly match what the UI observes
    #         tupleSelector = TupleSelector(StringIntTuple.tupleName(), {})
    #         self._tupleObservable.notifyOfTupleUpdate(tupleSelector)
    #
    #     finally:
    #         # Always close the session after we create it
    #         session.close()

    def agentNotifiedOfUpdate(self, updateStr):
        logger.debug("Agent said : %s", updateStr)
