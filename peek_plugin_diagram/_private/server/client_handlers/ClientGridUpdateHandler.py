import logging
from typing import Dict

from peek_abstract_chunked_index.private.server.client_handlers.ChunkedIndexChunkUpdateHandlerABC import \
    ChunkedIndexChunkUpdateHandlerABC
from peek_abstract_chunked_index.private.tuples.ChunkedIndexEncodedChunkTupleABC import \
    ChunkedIndexEncodedChunkTupleABC
from peek_plugin_diagram._private.client.controller.GridCacheController import \
    clientGridUpdateFromServerFilt
from peek_plugin_diagram._private.storage.GridKeyIndex import GridKeyIndexCompiled

logger = logging.getLogger(__name__)


class ClientGridUpdateHandler(ChunkedIndexChunkUpdateHandlerABC):
    _ChunkedTuple: ChunkedIndexEncodedChunkTupleABC = GridKeyIndexCompiled
    _updateFromServerFilt: Dict = clientGridUpdateFromServerFilt
    _logger: logging.Logger = logger
