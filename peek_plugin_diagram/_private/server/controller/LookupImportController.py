import logging
from typing import List, Optional

from twisted.internet.defer import inlineCallbacks

logger = logging.getLogger(__name__)


class LookupImportController:
    def __init__(self, dbSessionCreator):
        self._dbSessionCreator = dbSessionCreator

    def shutdown(self):
        pass

    @inlineCallbacks
    def importLookups(self, modelSetName: str, coordSetName: Optional[str], lookupTupleType: str,
                      lookupTuples: List):
        yield AgentImportLookup().import_(modelSetName, lookupTupleType, lookupTuples)

        from peek.core.data_cache.DispLookupDataCache import dispLookupDataCache
        dispLookupDataCache.refreshAll()
