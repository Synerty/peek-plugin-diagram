import logging
from typing import List

from vortex.rpc.RPC import vortexRPC

from peek_abstract_chunked_index.private.server.client_handlers.ChunkedIndexChunkLoadRpcABC import \
    ChunkedIndexChunkLoadRpcABC
from peek_plugin_base.PeekVortexUtil import peekServerName, peekClientName
from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.storage.branch.BranchIndexEncodedChunk import \
    BranchIndexEncodedChunk

logger = logging.getLogger(__name__)


class BranchIndexChunkLoadRpc(ChunkedIndexChunkLoadRpcABC):

    def makeHandlers(self):
        """ Make Handlers

        In this method we start all the RPC handlers
        start() returns an instance of it's self so we can simply yield the result
        of the start method.

        """

        yield self.loadBranchIndexChunks.start(funcSelf=self)
        logger.debug("RPCs started")

    # -------------
    @vortexRPC(peekServerName, acceptOnlyFromVortex=peekClientName, timeoutSeconds=60,
               additionalFilt=diagramFilt, deferToThread=True)
    def loadBranchIndexChunks(self, offset: int, count: int) -> List[
        BranchIndexEncodedChunk]:
        """ Update Page Loader Status

        Tell the server of the latest status of the loader

        """
        return self.ckiInitialLoadChunksBlocking(offset, count, BranchIndexEncodedChunk)
