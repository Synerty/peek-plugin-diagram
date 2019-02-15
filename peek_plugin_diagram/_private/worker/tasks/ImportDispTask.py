import json
import logging
from datetime import datetime
from typing import List, Dict, Tuple

import pytz
from geoalchemy2.shape import to_shape

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.server.controller.DispCompilerQueueController import \
    DispCompilerQueueController
from peek_plugin_diagram._private.storage.Display import \
    DispBase, DispEllipse, DispPolygon, DispText, DispPolyline, DispGroup, \
    DispGroupPointer, DispGroupItem
from peek_plugin_diagram._private.storage.ModelSet import \
    ModelCoordSet, getOrCreateCoordSet
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from peek_plugin_diagram._private.worker.tasks.ImportDispLink import importDispLinks
from peek_plugin_diagram._private.worker.tasks.LookupHashConverter import \
    LookupHashConverter
from peek_plugin_diagram.tuples.shapes.ImportDispEllipseTuple import \
    ImportDispEllipseTuple
from peek_plugin_diagram.tuples.shapes.ImportDispGroupPtrTuple import \
    ImportDispGroupPtrTuple
from peek_plugin_diagram.tuples.shapes.ImportDispGroupTuple import ImportDispGroupTuple
from peek_plugin_diagram.tuples.shapes.ImportDispPolygonTuple import \
    ImportDispPolygonTuple
from peek_plugin_diagram.tuples.shapes.ImportDispPolylineTuple import \
    ImportDispPolylineTuple
from peek_plugin_diagram.tuples.shapes.ImportDispTextTuple import ImportDispTextTuple
from peek_plugin_livedb.tuples.ImportLiveDbItemTuple import ImportLiveDbItemTuple
from txcelery.defer import DeferrableTask
from vortex.Payload import Payload

logger = logging.getLogger(__name__)

IMPORT_TUPLE_MAP = {
    ImportDispGroupTuple.tupleType(): DispGroup,
    ImportDispGroupPtrTuple.tupleType(): DispGroupPointer,
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
    'textStyleHash': 'textStyleId',
    'dispGroupHash': 'groupId'
}


@DeferrableTask
@celeryApp.task(bind=True)
def importDispsTask(self, modelSetKey: str, coordSetKey: str,
                    importGroupHash: str, dispsEncodedPayload: bytes) -> List[
    ImportLiveDbItemTuple]:
    """ Import Disp Task

    :returns None

    """
    try:
        disps = Payload().fromEncodedPayload(dispsEncodedPayload).tuples

        coordSet = _loadCoordSet(modelSetKey, coordSetKey)

        dispIdsToCompile, dispLinkImportTuples, ormDisps, dispGroupLinks = _importDisps(
            coordSet, disps
        )

        _bulkLoadDispsTask(
            coordSet, importGroupHash, ormDisps, dispGroupLinks
        )

        liveDbImportTuples = importDispLinks(
            coordSet, importGroupHash, dispLinkImportTuples
        )

        DispCompilerQueueController.queueDispIdsToCompile(
            dispIdsToCompile, CeleryDbConn.getDbSession
        )

        return liveDbImportTuples

    except Exception as e:
        logger.exception(e)
        logger.info("Retrying import displays, %s", e)
        raise self.retry(exc=e, countdown=3)


def _loadCoordSet(modelSetKey, coordSetKey):
    ormSession = CeleryDbConn.getDbSession()
    try:
        coordSet = getOrCreateCoordSet(ormSession, modelSetKey, coordSetKey)
        ormSession.expunge_all()
        return coordSet

    finally:
        ormSession.close()


def _importDisps(coordSet: ModelCoordSet, importDisps: List):
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

    dispGroupLinks = []

    ormSession = CeleryDbConn.getDbSession()
    try:

        lookupConverter = LookupHashConverter(ormSession,
                                              modelSetId=coordSet.modelSetId,
                                              coordSetId=coordSet.id)

        dispGroupIdByImportHash: Dict[str, int] = {}
        dispGroupPtrWithTargetHash: List[Tuple[DispGroupPointer, str]] = []
        dispGroupChildWithTargetHash: List[Tuple[DispBase, str]] = []

        for importDisp in importDisps:
            _convertGeom(importDisp)

            ormDisp = _convertImportTuple(importDisp)
            ormDisps.append(ormDisp)

            # Preallocate the IDs for performance on PostGreSQL
            ormDisp.id = next(dispIdGen)
            dispIdsToCompile.append(ormDisp.id)

            ormDisp.coordSetId = coordSet.id

            # If this is a dispGroup, index it's ID
            if isinstance(ormDisp, DispGroup):
                dispGroupIdByImportHash[ormDisp.importHash] = ormDisp.id

            # If this is a dispGroupPtr, index it's targetHash so we can update it
            if isinstance(ormDisp, DispGroupPointer):
                dispGroupPtrWithTargetHash.append(
                    (ormDisp, importDisp.targetDispGroupHash)
                )

            # If this is a dispGroupPtr, index it's targetHash so we can update it
            parentDispGroupHash = getattr(importDisp, "parentDispGroupHash", None)
            if parentDispGroupHash:
                dispGroupChildWithTargetHash.append((ormDisp, parentDispGroupHash))

            # Add some interim data to the import display link, so it can be created
            if hasattr(importDisp, "liveDbDispLinks"):
                for importDispLink in importDisp.liveDbDispLinks:
                    attrName = importDispLink.dispAttrName
                    importDispLink.internalRawValue = getattr(ormDisp, attrName)
                    importDispLink.internalDispId = ormDisp.id
                    importDispLinks.append(importDispLink)

            # Convert the values of the liveDb attributes
            lookupConverter.convertLookups(ormDisp)

            # Add the after translate value, this is the Display Value
            if hasattr(importDisp, "liveDbDispLinks"):
                for importDispLink in importDisp.liveDbDispLinks:
                    attrName = importDispLink.dispAttrName
                    importDispLink.internalDisplayValue = getattr(ormDisp, attrName)

        # Link the DispGroups
        # Create the links between the Disp and DispGroup
        for ormDisp, groupHash in dispGroupChildWithTargetHash:
            groupOrmObjId = dispGroupIdByImportHash.get(groupHash)
            if groupOrmObjId is None:
                raise Exception(
                    "DispGroup with importHash %s doesn't exist" % groupHash)

            dispGroupLinks.append(
                DispGroupItem(groupId=groupOrmObjId, itemId=ormDisp.id)
            )

        # Link the DispGroupPtr to the DispGroup
        for ormDisp, groupHash in dispGroupPtrWithTargetHash:
            groupOrmObjId = dispGroupIdByImportHash.get(groupHash)
            if groupOrmObjId is None:
                raise Exception(
                    "DispGroup with importHash %s doesn't exist" % groupHash)

            ormDisp.groupId = groupOrmObjId


    finally:
        ormSession.close()

    return dispIdsToCompile, importDispLinks, ormDisps, dispGroupLinks


def _convertGeom(importDisp):
    if not hasattr(importDisp, "geom"):
        return

    coordArray = []
    shapelyShape = to_shape(importDisp.geom)

    from shapely.geometry.polygon import Polygon
    if isinstance(shapelyShape, Polygon):
        coords = shapelyShape.exterior.coords
    else:
        coords = shapelyShape.coords

    for i in coords:
        coordArray.append(i[0])
        coordArray.append(i[1])

    importDisp.geom = json.dumps(coordArray)


def _convertImportTuple(importDisp):
    if not importDisp.tupleType() in IMPORT_TUPLE_MAP:
        raise Exception(
            "Import Tuple %s is not a valid type" % importDisp.tupleType()
        )

    disp = IMPORT_TUPLE_MAP[importDisp.tupleType()]()

    for importFieldName in importDisp.tupleFieldNames():
        if importFieldName == "data":
            disp.dataJson = json.dumps(importDisp.data)
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


def _bulkLoadDispsTask(coordSet: ModelCoordSet, importGroupHash: str,
                       disps: List, dispGroupLinks: List[DispGroupItem]):
    """ Import Disps Links

    1) Drop all disps with matching importGroupHash

    2) set the  coordSetId

    :param coordSet:
    :param importGroupHash:
    :param disps: An array of disp objects to import
    :return:
    """

    startTime = datetime.now(pytz.utc)

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
                coords = json.loads(disp.geomJson)
                coordSet.initialPanX = coords[0]
                coordSet.initialPanY = coords[1]
                coordSet.initialZoom = 0.05
                ormSession.merge(coordSet)
                break

        ormSession.commit()

        ormSession.bulk_save_objects(disps, update_changed_only=False)

        # Insert the Disp Group links
        if dispGroupLinks:
            ormSession.execute(
                DispGroupItem.__table__.insert(),
                [o.tupleToSqlaBulkInsertDict() for o in dispGroupLinks]
            )

        ormSession.commit()

        logger.info("Inserted %s Disps in %s",
                    len(disps), (datetime.now(pytz.utc) - startTime))

    finally:
        ormSession.close()
