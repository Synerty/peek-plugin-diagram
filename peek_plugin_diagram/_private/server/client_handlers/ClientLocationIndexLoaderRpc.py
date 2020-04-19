import logging
from typing import List

from sqlalchemy import select
from vortex.rpc.RPC import vortexRPC

from peek_plugin_base.PeekVortexUtil import peekServerName, peekClientName
from peek_plugin_base.storage.DbConnection import DbSessionCreator
from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.storage.LocationIndex import LocationIndexCompiled
from peek_plugin_diagram._private.storage.ModelSet import ModelSet
from peek_plugin_diagram._private.tuples.location_index.EncodedLocationIndexTuple import \
    EncodedLocationIndexTuple

logger = logging.getLogger(__name__)


class ClientLocationIndexLoaderRpc:
    def __init__(self, dbSessionCreator: DbSessionCreator):
        self._dbSessionCreator = dbSessionCreator

    def makeHandlers(self):
        """ Make Handlers

        In this method we start all the RPC handlers
        start() returns an instance of it's self so we can simply yield the result
        of the start method.

        """

        yield self.loadLocationIndexes.start(funcSelf=self)
        logger.debug("RPCs started")

    # -------------
    @vortexRPC(peekServerName, acceptOnlyFromVortex=peekClientName, timeoutSeconds=60,
               additionalFilt=diagramFilt, deferToThread=True)
    def loadLocationIndexes(self, offset: int, count: int) -> List[
        EncodedLocationIndexTuple]:
        """ Update Page Loader Status

        Tell the server of the latest status of the loader

        """
        session = self._dbSessionCreator()
        try:
            chunkTable = LocationIndexCompiled.__table__
            msTable = ModelSet.__table__

            sql = select([chunkTable.c.indexBucket,
                          chunkTable.c.blobData,
                          chunkTable.c.lastUpdate,
                          msTable.c.key]) \
                .select_from(chunkTable.join(msTable)) \
                .order_by(chunkTable.c.indexBucket) \
                .offset(offset) \
                .limit(count)

            sqlData = session.execute(sql).fetchall()

            results: List[EncodedLocationIndexTuple] = [
                LocationIndexCompiled.sqlCoreLoad(item)
                for item in sqlData
            ]

            return results

        finally:
            session.close()
