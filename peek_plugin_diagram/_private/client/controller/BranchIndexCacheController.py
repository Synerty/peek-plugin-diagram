import logging

from peek_abstract_chunked_index.private.client.controller.ACICacheControllerABC import (
    ACICacheControllerABC,
)
from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.server.client_handlers.BranchIndexChunkLoadRpc import (
    BranchIndexChunkLoadRpc,
)
from peek_plugin_diagram._private.storage.branch.BranchIndexEncodedChunk import (
    BranchIndexEncodedChunk,
)
from peek_plugin_diagram._private.tuples.branch.BranchIndexUpdateDateTuple import (
    BranchIndexUpdateDateTuple,
)

logger = logging.getLogger(__name__)

clientBranchIndexUpdateFromServerFilt = dict(
    key="clientBranchIndexUpdateFromServer"
)
clientBranchIndexUpdateFromServerFilt.update(diagramFilt)


class BranchIndexCacheController(ACICacheControllerABC):
    """BranchIndex Cache Controller

    The BranchIndex cache controller stores all the chunks in memory,
    allowing fast access from the mobile and desktop devices.

    """

    _ChunkedTuple = BranchIndexEncodedChunk
    _UpdateDateTupleABC = BranchIndexUpdateDateTuple
    _chunkLoadRpcMethod = BranchIndexChunkLoadRpc.loadBranchIndexChunks
    _chunkIndexDeltaRpcMethod = BranchIndexChunkLoadRpc.loadBranchIndexDelta
    _updateFromLogicFilt = clientBranchIndexUpdateFromServerFilt
    _logger = logger
