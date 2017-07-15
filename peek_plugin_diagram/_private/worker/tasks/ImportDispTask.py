import json
import logging
from datetime import datetime
from typing import List

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.server.controller.DispCompilerQueueController import DispCompilerQueueController
from peek_plugin_diagram._private.storage.Display import DispBase, DispAction, \
    DispEllipse, DispPolylineConn, DispPolygon, DispText, DispPolyline
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet, \
    getOrCreateCoordSet
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from peek_plugin_diagram._private.worker.tasks.ImportDispLink import importDispLinks
from peek_plugin_diagram._private.worker.tasks.LookupHashConverter import \
    LookupHashConverter
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
from peek_plugin_livedb.tuples.ImportLiveDbItemTuple import ImportLiveDbItemTuple
from sqlalchemy import select
from txcelery.defer import DeferrableTask
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
    'colorHash': 'colorId',
    'fillColorHash': 'fillColorId',
    'lineColorHash': 'lineColorId',
    'textStyleHash': 'textStyleId'
}


@DeferrableTask
@celeryApp.task(bind=True)
def importDispsTask(self, modelSetName: str, coordSetName: str,
                    importGroupHash: str, disps: List)-> List[ImportLiveDbItemTuple]:
    """ Import Disp Task

    :returns None

    """
    try:
        coordSet = _loadCoordSet(modelSetName, coordSetName)

        dispIdsToCompile, dispLinkImportTuples, ormDisps = _importDisps(
            coordSet, importGroupHash, disps
        )

        dispIdsToCompile = _bulkLoadDispsTask(
            coordSet, importGroupHash, ormDisps, dispIdsToCompile
        )

        liveDbImportTuples = importDispLinks(
            coordSet, importGroupHash, dispLinkImportTuples
        )

        DispCompilerQueueController.queueDispIdsToCompile(
            dispIdsToCompile, CeleryDbConn.getDbSession
        )

        return liveDbImportTuples

    except Exception as e:
        # logger.exception(e)
        logger.info("Retrying import displays, %s", e)
        raise self.retry(exc=e, countdown=3)


def _loadCoordSet(modelSetName, coordSetName):
    ormSession = CeleryDbConn.getDbSession()
    try:
        coordSet = getOrCreateCoordSet(ormSession, modelSetName, coordSetName)
        ormSession.expunge_all()
        return coordSet

    finally:
        ormSession.close()


def _importDisps(coordSet: ModelCoordSet, importGroupHash: str, importDisps):
    """ Link Disps

    1) Use the AgentImportDispGridLookup to convert lookups from importHash
        to id
    2) set the  coordSetId

    This is not done in a thread because the lookups cause issues

    """

    dispIdGen = CeleryDbConn.prefetchDeclarativeIds(DispBase, len(importDisps))

    dispIdsToCompile = []
    importDispLinks = []
    ormDisps = []

    ormSession = CeleryDbConn.getDbSession()
    try:

        lookupConverter = LookupHashConverter(ormSession,
                                              modelSetId=coordSet.modelSetId,
                                              coordSetId=coordSet.id)

        for importDisp in importDisps:
            ormDisp = _convertImportTuple(importDisp)
            ormDisps.append(ormDisp)

            # Preallocate the IDs for performance on PostGreSQL
            ormDisp.id = next(dispIdGen)
            dispIdsToCompile.append(ormDisp.id)

            ormDisp.coordSetId = coordSet.id

            # Add some interim data to the import display link, so it can be created
            for importDispLink in importDisp.liveDbDispLinks:
                attrName = importDispLink.dispAttrName
                importDispLink.internalRawValue = getattr(ormDisp, attrName)
                importDispLink.internalDispId = ormDisp.id
                importDispLinks.append(importDispLink)

            # Convert the values of the liveDb attributes
            lookupConverter.convertLookups(ormDisp)

            # Add the after translate value, this is the Display Value
            for importDispLink in importDisp.liveDbDispLinks:
                attrName = importDispLink.dispAttrName
                importDispLink.internalDisplayValue = getattr(ormDisp, attrName)

    finally:
        ormSession.close()

    return dispIdsToCompile, importDispLinks, ormDisps


def _convertImportTuple(importDisp):
    if not importDisp.tupleType() in IMPORT_TUPLE_MAP:
        raise Exception(
            "Import Tuple %s is not a valid type" % importDisp.tupleType()
        )

    disp = IMPORT_TUPLE_MAP[importDisp.tupleType()]()

    for importFieldName in importDisp.tupleFieldNames():
        if importFieldName == "props":
            disp.propsJson = json.dumps(importDisp.props)
            continue

        if importFieldName == "geom":
            disp.geomJson = importDisp.geom

            # Moved to server, due to celery 3 pickle problem
            # disp.geomJson = json.dumps(convertFromWkbElement(importDisp.geom))
            continue

        # Convert the field name if it exists
        dispFieldName = IMPORT_FIELD_NAME_MAP.get(importFieldName, importFieldName)

        setattr(disp, dispFieldName, getattr(importDisp, importFieldName))

    return disp


def _bulkLoadDispsTask(coordSet, importGroupHash, disps, dispIdsToCompile):
    """ Import Disps Links

    1) Drop all disps with matching importGroupHash

    2) set the  coordSetId

    :param coordSet:
    :param importGroupHash:
    :param disps: An array of disp objects to import
    :param dispIdsToCompile: An array of import LiveDB Disp Links to import
    :return:
    """

    startTime = datetime.utcnow()

    dispTable = DispBase.__table__

    ormSession = CeleryDbConn.getDbSession()
    try:
        ormSession.execute(dispTable
                           .delete()
                           .where(dispTable.c.importGroupHash == importGroupHash))

        # Initialise the ModelCoordSet initial position if it's not set
        if (not coordSet.initialPanX
            and not coordSet.initialPanY
            and not coordSet.initialZoom):
            for disp in disps:
                if not hasattr(disp, 'geomJson'):
                    continue
                point = json.loads(disp.geomJson)[0]
                coordSet.initialPanX = point['x']
                coordSet.initialPanY = point['y']
                coordSet.initialZoom = 0.05
                ormSession.merge(coordSet)
                break


        ormSession.commit()

        with ormSession.begin(subtransactions=True):
            ormSession.bulk_save_objects(disps, update_changed_only=False)
        ormSession.commit()

        logger.info("Inserted %s Disps in %s",
                    len(disps), (datetime.utcnow() - startTime))

        if not dispIdsToCompile:
            result = ormSession.execute(
                select([dispTable.c.id])
                    .where(dispTable.c.importGroupHash == importGroupHash)
            )

            dispIdsToCompile = [o[0] for o in result.fetchall()]

        return dispIdsToCompile

    finally:
        ormSession.close()
