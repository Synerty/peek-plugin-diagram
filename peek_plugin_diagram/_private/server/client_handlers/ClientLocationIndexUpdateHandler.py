import logging
from typing import List

from sqlalchemy.orm import joinedload
from twisted.internet.defer import Deferred

from peek_plugin_base.PeekVortexUtil import peekClientName
from peek_plugin_base.storage.StorageUtil import makeOrmValuesSubqueryCondition
from peek_plugin_diagram._private.client.controller.LocationIndexCacheController import \
    clientLocationIndexUpdateFromServerFilt
from peek_plugin_diagram._private.storage.LocationIndex import LocationIndexCompiled
from peek_plugin_diagram._private.tuples.LocationIndexTuple import LocationIndexTuple
from vortex.DeferUtil import vortexLogFailure, deferToThreadWrapWithLogger
from vortex.Payload import Payload
from vortex.VortexFactory import VortexFactory, NoVortexException

logger = logging.getLogger(__name__)


class ClientLocationIndexUpdateHandler:
    """ Client Update Controller

    This controller handles sending updates the the client.

    It uses lower level Vortex API

    It does the following a broadcast to all clients:

    1) Sends grid updates to the clients

    2) Sends Lookup updates to the clients

    """

    def __init__(self, dbSessionCreator):
        self._dbSessionCreator = dbSessionCreator

    def shutdown(self):
        pass

    def sendLocationIndexes(self, indexBuckets: List[str]) -> None:
        """ Send Location Indexes

        Send grid updates to the client services

        :param indexBuckets: A list of location index buckets that have been updated
        :returns: Nothing
        """

        if not indexBuckets:
            return

        d: Deferred = self._serialiseLocationIndexes(indexBuckets)
        d.addCallback(VortexFactory.sendVortexMsg, destVortexName=peekClientName)
        d.addErrback(self._sendErrback, indexBuckets)

    def _sendErrback(self, failure, indexBucket):

        if failure.check(NoVortexException):
            logger.debug("No clients are online to send the grid to, %s", indexBucket)
            return

        vortexLogFailure(failure, logger)

    @deferToThreadWrapWithLogger(logger)
    def _serialiseLocationIndexes(self, indexBuckets: List[str]) -> bytes:
        session = self._dbSessionCreator()
        try:
            ormObjs = (
                session.query(LocationIndexCompiled)
                    .options(joinedload(LocationIndexCompiled.modelSet))
                    .filter(makeOrmValuesSubqueryCondition(
                    session, LocationIndexCompiled.indexBucket, indexBuckets
                ))
                    .yield_per(200)
            )

            locationIndexTuples: List[LocationIndexTuple] = []
            for ormObj in ormObjs:
                locationIndexTuples.append(
                    LocationIndexTuple(
                        modelSetKey=ormObj.modelSet.key,
                        indexBucket=ormObj.indexBucket,
                        blobData=ormObj.blobData,
                        lastUpdate=ormObj.lastUpdate
                    )
                )

            return Payload(filt=clientLocationIndexUpdateFromServerFilt,
                           tuples=locationIndexTuples).toVortexMsg()

        finally:
            session.close()