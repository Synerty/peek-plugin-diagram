import logging
from typing import List

from vortex.DeferUtil import deferToThreadWrapWithLogger

logger = logging.getLogger(__name__)


class DispImportController:
    def __init__(self, dbSessionCreator):
        self._dbSessionCreator = dbSessionCreator

    def shutdown(self):
        pass

    def importDisps(self, modelSetName:str, coordSetName:str, importGroupHash:str, disps:List) :
        d = AgentImportDispGrid().importDisps(modelSetName, coordSetName,
                                              importGroupHash, disps)


        d.addCallback(self._importDispLinks, importGroupHash, disps)
        d.addCallback(self._queueDispsForCompile, vortexUuid, successFilt)
        d.addCallback(self._sentLiveDbKeysToAgents, vortexUuid, successFilt)

        # Don't return the deferred, we don't want PayloadIO to report how long this takes
        # return d


    def _importDispLinks(self, importDispsDeferResult, importGroupHash, disps):
        # Returned from importDisps
        coordSetId, dispIdsToCompile = importDispsDeferResult

        d = AgentImportDispLiveDbLinks().importDispLiveDbDispLinks(
            coordSetId, importGroupHash, disps)

        # Maintain the deferred result for the next function
        d.addCallback(lambda newLiveDbIds: (dispIdsToCompile, newLiveDbIds))
        return d



    @deferToThreadWrapWithLogger(logger)
    def _queueDispsForCompile(self, importDispsDeferResult, vortexUuid, successFilt):
        dispIdsToCompile, newLiveDbIds = importDispsDeferResult

        logger.debug("Queueing disp grids for %s", successFilt['infoKey'])
        dispQueueCompiler.queueDisps(dispIdsToCompile)

        return newLiveDbIds


    @deferToThreadWrapWithLogger(logger)
    def _sentLiveDbKeysToAgents(self, newLiveDbIds, vortexUuid, successFilt):
        logger.debug("Sending new liveDbKeys to agents for %s", successFilt['infoKey'])
        liveDb.registerNewLiveDbKeys(keyIds=newLiveDbIds)

        return True
