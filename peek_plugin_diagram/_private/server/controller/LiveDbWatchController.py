import logging
from typing import List, Dict

from sqlalchemy import select, insert
from twisted.internet.defer import Deferred, inlineCallbacks

from peek_plugin_diagram._private.server.cache.DispLookupDataCache import \
    DispLookupDataCache
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyIndex, \
    DispIndexerQueue
from peek_plugin_diagram._private.storage.LiveDbDispLink import LiveDbDispLink
from peek_plugin_livedb.server.LiveDBReadApiABC import LiveDBReadApiABC
from peek_plugin_livedb.server.LiveDBWriteApiABC import LiveDBWriteApiABC
from peek_plugin_livedb.tuples.LiveDbDisplayValueUpdateTuple import \
    LiveDbDisplayValueUpdateTuple
from peek_plugin_livedb.tuples.LiveDbRawValueUpdateTuple import LiveDbRawValueUpdateTuple
from vortex.DeferUtil import deferToThreadWrapWithLogger, \
    vortexInlineCallbacksLogAndConsumeFailure

logger = logging.getLogger(__name__)


class LiveDbWatchController:
    """ Watch Grid Controller

    This controller handles most of the interactions with the LiveDB plugin..

    That is :

    1) Informing the LiveDB that the keys are being watched

    2) Sending updates for these watched grids to the clients (???? is this the right spot?)

    3) Computing display values for the live db

    4) Queueing display updates to be compiled, based on events from the livedb.

    """

    def __init__(self, liveDbWriteApi: LiveDBWriteApiABC,
                 liveDbReadApi: LiveDBReadApiABC,
                 dispLookupCache: DispLookupDataCache,
                 dbSessionCreator):
        self._liveDbWriteApi = liveDbWriteApi
        self._liveDbReadApi = liveDbReadApi
        self._dispLookupCache = dispLookupCache
        self._dbSessionCreator = dbSessionCreator

        self._liveDbReadApi.rawValueUpdatesObservable('pofDiagram').subscribe(
            on_next=self.processLiveDbRawValueUpdates
        )
        self._liveDbReadApi.displayValueUpdatesObservable('pofDiagram').subscribe(
            on_next=self.processLiveDbDisplayValueUpdates
        )

    def shutdown(self):
        pass

    @inlineCallbacks
    def updateClientWatchedGrids(self, clientId: str, gridKeys: List[str]) -> Deferred:
        """ Update Client Watched Grids

        Tell the server that these grids are currently being watched by users.

        :param clientId: A unique identifier of the client (Maybe it's vortex uuid)
        :param gridKeys: A list of grid keys that this client is observing.
        :returns: Nothing
        """
        logger.debug("TODO TODO TODO TODO  Notify the livedb to prioritise the keys")
        # d = self._liveDbWatchController.updateClientWatchedGrids(clientId, gridKeys)
        # d.addErrback(vortexLogFailure, logger, consumeError=True)

        try:
            liveDbKeys = yield self.getLiveDbKeys(gridKeys)
            self._liveDbWriteApi.prioritiseLiveDbValueAcquisition(
                'pofDiagram', liveDbKeys
            )

        except Exception as e:
            logger.exception(e)

    @deferToThreadWrapWithLogger(logger)
    def getLiveDbKeys(self, gridKeys) -> List[str]:

        session = self._dbSessionCreator()
        try:
            return [t[0] for t in
                    session.query(LiveDbDispLink.liveDbKey)
                        .join(GridKeyIndex,
                              GridKeyIndex.dispId == LiveDbDispLink.dispId)
                        .filter(GridKeyIndex.gridKey.in_(gridKeys))
                        .yield_per(1000)
                        .distinct()]
        finally:
            session.close()

    @vortexInlineCallbacksLogAndConsumeFailure(logger)
    def processLiveDbRawValueUpdates(self, updates: List[LiveDbRawValueUpdateTuple]):
        keys = [u.key for u in updates]

        deferredGenerator = self._liveDbReadApi.bulkLoadDeferredGenerator(
            'pofDiagram', keys)

        displayValueUpdates: List[LiveDbDisplayValueUpdateTuple] = []
        while True:
            nextDeferred = next(deferredGenerator)
            items = yield nextDeferred
            if not items:
                break

            keyCoordSetIds = yield self._getCoordSetIdsForLiveDbKeys(keys)

            # The level lookups are the ones that change per coord set.
            for item in items:
                coordSetId = keyCoordSetIds.get(item.key)
                if coordSetId is None:
                    continue

                displayValue = yield self._dispLookupCache.liveDbValueTranslate(
                    coordSetId, item.dataType, item.rawValue)

                displayValueUpdates.append(LiveDbDisplayValueUpdateTuple(
                    key=item.key, displayValue=displayValue
                ))

        self._liveDbWriteApi.updateDisplayValue('pofDiagram', displayValueUpdates)

    @deferToThreadWrapWithLogger(logger)
    def _getCoordSetIdsForLiveDbKeys(self, keys: List[str]) -> Dict[str, int]:
        result = {}

        session = self._dbSessionCreator()
        try:
            qry = (session.query(LiveDbDispLink.liveDbKey, LiveDbDispLink.coordSetId)
                   .filter(LiveDbDispLink.liveDbKey.in_(keys))
                   .yield_per(1000))

            for key, coordSetId in qry:
                result[key] = coordSetId

            return result

        finally:
            session.close()

    @deferToThreadWrapWithLogger(logger, consumeError=True)
    def processLiveDbDisplayValueUpdates(self,
                                         updates: List[LiveDbDisplayValueUpdateTuple]):

        logger.debug("TODO TODO - processLiveDbDisplayValueUpdates coordSetId")
        linkTable = LiveDbDispLink.__table__
        queueTable = DispIndexerQueue.__table__

        session = self._dbSessionCreator()
        try:
            updatedKeys = [u.key for u in updates]
            stmt = (select([linkTable.c.dispId])
                    .where(linkTable.c.liveDbKey.in_(updatedKeys)))

            ins = queueTable.insert().from_select(['dispId'], stmt)
            session.execute(ins)
            session.commit()

        finally:
            session.close()
