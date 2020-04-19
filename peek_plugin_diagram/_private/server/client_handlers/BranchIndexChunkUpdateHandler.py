import logging
from typing import Dict

from peek_abstract_chunked_index.private.server.client_handlers.ChunkedIndexChunkUpdateHandlerABC import \
    ChunkedIndexChunkUpdateHandlerABC
from peek_abstract_chunked_index.private.tuples.ChunkedIndexEncodedChunkTupleABC import \
    ChunkedIndexEncodedChunkTupleABC
from peek_plugin_diagram._private.client.controller.BranchIndexCacheController import \
    clientBranchIndexUpdateFromServerFilt
from peek_plugin_diagram._private.storage.branch.BranchIndexEncodedChunk import \
    BranchIndexEncodedChunk

logger = logging.getLogger(__name__)


class BranchIndexChunkUpdateHandler(ChunkedIndexChunkUpdateHandlerABC):
    _ChunkedTuple: ChunkedIndexEncodedChunkTupleABC = BranchIndexEncodedChunk
    _updateFromServerFilt: Dict = clientBranchIndexUpdateFromServerFilt
    _logger: logging.Logger = logger
