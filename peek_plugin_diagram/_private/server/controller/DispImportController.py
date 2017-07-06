import logging
from datetime import datetime
from typing import List

from twisted.internet.defer import inlineCallbacks, returnValue

from peek_plugin_diagram._private.server.cache.DispLookupDataCache import \
    DispLookupDataCache
from peek_plugin_diagram._private.server.controller.DispLinkImportController import \
    DispLinkImportController
from peek_plugin_diagram._private.server.queue.DispCompilerQueue import DispCompilerQueue
from peek_plugin_diagram._private.storage.Display import DispBase, DispAction, \
    DispPolylineConn, DispEllipse, DispPolygon, DispPolyline, DispText
from peek_plugin_diagram._private.storage.ModelSet import getOrCreateCoordSet, \
    ModelCoordSet
from peek_plugin_diagram.tuples.shapes.ImportDispActionTuple import ImportDispActionTuple
from peek_plugin_diagram.tuples.shapes.ImportDispConnectionTuple import \
    ImportDispConnectionTuple
from peek_plugin_diagram.tuples.shapes.ImportDispEllipseTuple import \
    ImportDispEllipseTuple
from peek_plugin_diagram.tuples.shapes.ImportDispPolygonTuple import \
    ImportDispPolygonTuple
from peek_plugin_diagram.tuples.shapes.ImportDispPolylineTuple import \
    ImportDispPolylineTuple
from peek_plugin_diagram.tuples.shapes.ImportDispTextTuple import ImportDispTextTuple
from vortex.DeferUtil import deferToThreadWrapWithLogger
from vortex.SerialiseUtil import convertFromWkbElement

logger = logging.getLogger(__name__)

IMPORT_TUPLE_MAP = {
    ImportDispActionTuple.tupleType(): DispAction,
    ImportDispConnectionTuple.tupleType(): DispPolylineConn,
    ImportDispEllipseTuple.tupleType(): DispEllipse,
    ImportDispPolygonTuple.tupleType(): DispPolygon,
    ImportDispPolylineTuple.tupleType(): DispPolyline,
    ImportDispTextTuple.tupleType(): DispText
}

IMPORT_FIELD_NAME_MAP = {
    'levelHash': 'levelId',
    'layerHash': 'layerId',
    'lineStyleHash': 'lineStyleId',
    'fillColorHash': 'fillColorId',
    'lineColorHash': 'lineColorId',
    'textStyleHash': 'textStyleId'
}


class DispImportController:
    def __init__(self, dbSessionCreator,
                 getPgSequenceGenerator,
                 dispLinkImportController: DispLinkImportController,
                 dispCompilerQueue: DispCompilerQueue,
                 dispLookupCache: DispLookupDataCache):

        self._dbSessionCreator = dbSessionCreator
        self._getPgSequenceGenerator = getPgSequenceGenerator
        self._dispLinkImportController = dispLinkImportController
        self._dispCompilerQueue = dispCompilerQueue
        self._dispLookupCache = dispLookupCache

    def shutdown(self):
        self._dispLinkImportController = None

    @inlineCallbacks
    def importDisps(self, modelSetName: str, coordSetName: str,
                    importGroupHash: str, disps: List):

        coordSet = yield self._loadCoordSet(modelSetName, coordSetName)

        dispIdsToCompile, importDispLinks = yield self._importDisps(
            modelSetName, coordSet, importGroupHash, disps
        )

        yield self._dispLinkImportController.importDispLiveDbDispLinks(
            modelSetName, coordSet, importGroupHash, importDispLinks
        )
        logger.debug("Queueing disp grids for %s", coordSetName)
        yield self._dispCompilerQueue.queueDisps(dispIdsToCompile)

    @deferToThreadWrapWithLogger(logger)
    def _loadCoordSet(self, modelSetName, coordSetName):
        ormSession = self._dbSessionCreator()
        try:
            coordSet = getOrCreateCoordSet(ormSession, modelSetName, coordSetName)
            ormSession.expunge_all()
            return coordSet

        finally:
            ormSession.close()

    @inlineCallbacks
    def _importDisps(self, modelSetName: str, coordSet: ModelCoordSet,
                     importGroupHash: str, importDisps):
        """ Link Disps

        1) Use the AgentImportDispGridLookup to convert lookups from importHash
            to id
        2) set the  coordSetId

        This is not done in a thread because the lookups cause issues

        """

        dispIdGen = yield self._getPgSequenceGenerator(DispBase, len(importDisps))

        dispIdsToCompile = []
        importDispLinks = []
        ormDisps = []

        for importDisp in importDisps:
            ormDisp = self._convertImportTuple(importDisp)
            ormDisps.append(ormDisp)

            # Preallocate the IDs for performance on PostGreSQL
            ormDisp.id = next(dispIdGen)
            dispIdsToCompile.append(ormDisp.id)

            ormDisp.coordSetId = coordSet.id
            ormDisp.dispJson = {}

            # Add some interim data to the import display link, so it can be created
            for importDispLink in importDisp.liveDbDispLinks:
                attrName = importDispLink.dispAttrName
                importDispLink.liveDbRawValue = getattr(ormDisp, attrName)
                importDispLink.dispId = ormDisp.id
                importDispLinks.append(importDispLink)

            # Convert the values of the liveDb attributes
            yield self._dispLookupCache.convertLookups(coordSet.id, ormDisp)

            # Add the after translate value, this is the Display Value
            for importDispLink in importDisp.liveDbDispLinks:
                attrName = importDispLink.dispAttrName
                importDispLink.liveDbDisplayValue = getattr(ormDisp, attrName)

        dispIdsToCompile = yield self._bulkLoadDisps(
            coordSet, importGroupHash, ormDisps, dispIdsToCompile
        )

        returnValue((dispIdsToCompile, importDispLinks))

    @deferToThreadWrapWithLogger(logger)
    def _bulkLoadDisps(self, coordSet, importGroupHash, disps, dispIdsToCompile):

        startTime = datetime.utcnow()
        logger.debug("Loaded lookups in %s", (datetime.utcnow() - startTime))

        ormSession = self._dbSessionCreator()
        try:

            (ormSession.query(DispBase)
             .filter(DispBase.importGroupHash == importGroupHash)
             .delete())

            # Initialise the ModelCoordSet initial position if it's not set
            if (not coordSet.initialPanX
                and not coordSet.initialPanY
                and not coordSet.initialZoom):
                for disp in disps:
                    if not hasattr(disp, 'geom'):
                        continue
                    point = convertFromWkbElement(disp.geom)[0]
                    coordSet.initialPanX = point['x']
                    coordSet.initialPanY = point['y']
                    coordSet.initialZoom = 0.05
                    break

            logger.debug("Finised setting %s Disp attributes in %s",
                         len(disps), (datetime.utcnow() - startTime))

            ormSession.commit()

            # Make this change, it's required to store the WKBElements
            for disp in disps:
                disp.geom = disp.geom.desc

            with ormSession.begin(subtransactions=True):
                ormSession.bulk_save_objects(disps, update_changed_only=False)
            ormSession.commit()

            logger.debug("Finished inserting %s Disps in %s",
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

    def _convertImportTuple(self, importDisp):
        if not importDisp.tupleType() in IMPORT_TUPLE_MAP:
            raise Exception(
                "Import Tuple %s is not a valid type" % importDisp.tupleType()
            )

        disp = IMPORT_TUPLE_MAP[importDisp.tupleType()]()

        for importFieldName in importDisp.tupleFieldNames():
            # Convert the field name if it exists
            dispFieldName = IMPORT_FIELD_NAME_MAP.get(importFieldName, importFieldName)

            setattr(disp, dispFieldName, getattr(importDisp, importFieldName))

        return disp
