import logging
from datetime import datetime
from typing import List

import shapely
from base64 import b64decode
from geoalchemy2.shape import from_shape
from twisted.internet.defer import inlineCallbacks, returnValue

from peek_plugin_diagram._private.server.cache.DispLookupDataCache import \
    DispLookupDataCache
from peek_plugin_diagram._private.server.controller.LiveDbController import \
    LiveDbController
from peek_plugin_diagram._private.server.controller.LiveDbImportController import \
    LiveDbImportController
from peek_plugin_diagram._private.server.queue.DispCompilerQueue import DispCompilerQueue
from peek_plugin_diagram._private.storage.Display import DispBase
from peek_plugin_diagram._private.storage.ModelSet import getOrCreateCoordSet
from vortex.DeferUtil import deferToThreadWrapWithLogger
from vortex.SerialiseUtil import convertFromWkbElement

logger = logging.getLogger(__name__)


class DispImportController:
    def __init__(self, dbSessionCreator,
                 getPgSequenceGenerator,
                 liveDbImportController: LiveDbImportController,
                 liveDbController: LiveDbController,
                 dispCompilerQueue: DispCompilerQueue,
                 dispLookupCache: DispLookupDataCache):

        self._dbSessionCreator = dbSessionCreator
        self._getPgSequenceGenerator = getPgSequenceGenerator
        self._liveDbImportController = liveDbImportController
        self._liveDbController = liveDbController
        self._dispCompilerQueue = dispCompilerQueue
        self._dispLookupCache = dispLookupCache

    def shutdown(self):
        self._liveDbImportController = None

    @inlineCallbacks
    def importDisps(self, modelSetName: str, coordSetName: str, importGroupHash: str,
                    disps: List):
        coordSetId, dispIdsToCompile = self._linkDisps(
            modelSetName, coordSetName, importGroupHash, disps
        )

        newLiveDbIds = self._liveDbImportController.importDispLiveDbDispLinks(
            coordSetId, importGroupHash, disps
        )

        logger.debug("Queueing disp grids for %s", coordSetName)
        self._dispCompilerQueue.queueDisps(dispIdsToCompile)

        logger.debug("Sending new liveDbKeys to agents for %s", coordSetName)
        self._liveDbController.registerNewLiveDbKeys(keyIds=newLiveDbIds)

        # Don't return the deferred, we don't want PayloadIO to report how long this takes
        # return d

    @inlineCallbacks
    def _linkDisps(self, modelSetName, coordSetName, importGroupHash, disps):
        """ Link Disps

        1) Use the AgentImportDispGridLookup to convert lookups from importHash
            to id
        2) set the  coordSetId

        This is not done in a thread because the lookups cause issues

        """

        dispIdGen, coordSetId = yield self._loadDispIds(
            coordSetName, len(disps), modelSetName
        )

        dispIdsToCompile = []

        for disp in disps:
            # Preallocate the IDs for performance on PostGreSQL
            if dispIdGen is not None:
                disp.id = next(dispIdGen)

            disp.coordSetId = coordSetId
            disp.dispJson = {}

            # Make a copy of the pre converted values for when the LiveDbKey needs
            # creating
            for dispLink in disp.importLiveDbDispLinks:
                attrName = dispLink.dispAttrName
                setattr(disp, attrName + 'Before', getattr(disp, attrName))

            # Convert the values of the liveDb attributes
            yield self._dispLookupCache.convertLookups(coordSetId, disp)

            # Convert the WKBElement from dumped shape
            geomWkbData = from_shape(shapely.wkb.loads(b64decode(disp.geom)))
            disp.geom = geomWkbData.desc
            disp.geomWkbData = geomWkbData

            if dispIdGen is not None:
                dispIdsToCompile.append(disp.id)

        dispIdsToCompile = yield self._bulkLoadDisps(
            modelSetName, coordSetName, importGroupHash, disps, dispIdsToCompile
        )

        returnValue((coordSetId, dispIdsToCompile))

    @deferToThreadWrapWithLogger(logger)
    def _loadDispIds(self, coordSetName, dispCount, modelSetName):
        session = self._dbSessionCreator()
        try:
            coordSetId = getOrCreateCoordSet(session, modelSetName, coordSetName).id

            dispIdGen = self._getPgSequenceGenerator(DispBase, dispCount, session)
            session.commit()

            return dispIdGen, coordSetId

        finally:
            session.close()

    @deferToThreadWrapWithLogger(logger)
    def _bulkLoadDisps(self, modelSetName, coordSetName, importGroupHash,
                       disps, dispIdsToCompile):

        startTime = datetime.utcnow()
        logger.debug("Loaded lookups in %s", (datetime.utcnow() - startTime))

        ormSession = self._dbSessionCreator()
        try:

            (ormSession.query(DispBase)
             .filter(DispBase.importGroupHash == importGroupHash)
             .delete())

            coordSet = getOrCreateCoordSet(ormSession, modelSetName, coordSetName)

            # Initialise the ModelCoordSet initial position if it's not set
            if (not coordSet.initialPanX
                and not coordSet.initialPanY
                and not coordSet.initialZoom):
                for disp in disps:
                    if not hasattr(disp, 'geom'):
                        continue
                    point = convertFromWkbElement(disp.geomWkbData)[0]
                    coordSet.initialPanX = point['x']
                    coordSet.initialPanY = point['y']
                    coordSet.initialZoom = 0.05
                    break

            logger.debug("Finised setting %s Disp attributes in %s",
                         len(disps), (datetime.utcnow() - startTime))

            ormSession.commit()

            with ormSession.begin(subtransactions=True):
                ormSession.bulk_save_objects(disps, update_changed_only=False)
            ormSession.commit()

            logger.debug("Finised inserting %s Disps in %s",
                         len(disps), (datetime.utcnow() - startTime))

            if not dispIdsToCompile:
                dispIdsToCompile = [o[0] for o in ormSession.query(DispBase.id)
                    .filter(DispBase.importGroupHash == importGroupHash)
                    .all()]

            return dispIdsToCompile

        except Exception as e:
            logger.exception(e)
            ormSession.rollback()
            raise

        finally:
            ormSession.close()
