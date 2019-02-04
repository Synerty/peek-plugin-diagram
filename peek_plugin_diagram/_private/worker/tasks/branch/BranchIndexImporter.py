from collections import defaultdict

import logging
import pytz
import typing
from datetime import datetime
from txcelery.defer import DeferrableTask
from typing import List, Dict
from vortex.Payload import Payload

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.Display import DispTextStyle
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.tuples.branch.BranchTuple import BranchTuple
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from peek_plugin_diagram._private.worker.tasks.LookupHashConverter import \
    LookupHashConverter
from peek_plugin_diagram._private.worker.tasks._ModelSetUtil import \
    getModelSetIdCoordSetId
from peek_plugin_diagram._private.worker.tasks.branch.BranchGridIndexUpdater import \
    _insertOrUpdateBranchGrids
from peek_plugin_diagram._private.worker.tasks.branch.BranchIndexUpdater import \
    _insertOrUpdateBranches
from peek_plugin_diagram.tuples.branches.ImportBranchTuple import ImportBranchTuple

logger = logging.getLogger(__name__)


@DeferrableTask
@celeryApp.task(bind=True)
def createOrUpdateBranches(self, importBranchesEncodedPayload: bytes) -> None:
    """ Convert Import Branch Tuples

    This method takes import branch tuples, and converts them to
    branch format used throughout the diagram plugin.

    (Thats the packed JSON wrapped by an accessor class)

    """
    # Decode importBranches payload
    importBranches: List[ImportBranchTuple] = (
        Payload().fromEncodedPayload(importBranchesEncodedPayload).tuples
    )

    # Validate the input importBranches
    _validateNewBranchIndexs(importBranches)

    # Do the import
    groupedBranches = _convertImportBranchTuples(importBranches)

    # Create a lookup of CoordSets by ID
    dbSession = CeleryDbConn.getDbSession()
    try:
        coordSetById = {i.id: i for i in dbSession.query(ModelCoordSet).all()}
        textStylesById = {i.id: i for i in dbSession.query(DispTextStyle).all()}
        dbSession.expunge_all()

    finally:
        dbSession.close()

    startTime = datetime.now(pytz.utc)

    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    transaction = conn.begin()

    try:
        for (modelSetKey, modelSetId, coordSetId), branches in groupedBranches.items():
            coordSet = coordSetById[coordSetId]
            _insertOrUpdateBranches(conn, modelSetKey, modelSetId, branches)
            _insertOrUpdateBranchGrids(conn, coordSet, textStylesById, branches)
            transaction.commit()

            logger.debug("Completed importing %s branches for coordSetId %s in %s",
                         len(branches),
                         coordSetId,
                         (datetime.now(pytz.utc) - startTime))

    except Exception as e:
        transaction.rollback()
        logger.debug("Retrying createOrUpdateBranches, %s", e)
        raise self.retry(exc=e, countdown=3)

    finally:
        conn.close()


def _convertImportBranchTuples(importBranches: List[ImportBranchTuple]
                               ) -> Dict[typing.Tuple[str, int, int], List[BranchTuple]]:
    """ Convert Import Branch Tuples

    This method takes import branch tuples, and converts them to
    branch format used throughout the diagram plugin.

    (Thats the packed JSON wrapped by an accessor class)

    """

    # Get a map for the coordSetIds
    modelKeyCoordKeyTuples = [(b.modelSetKey, b.coordSetKey) for b in importBranches]

    coordSetIdByModelKeyCoordKeyTuple = getModelSetIdCoordSetId(modelKeyCoordKeyTuples)

    # Sort out the importBranches by coordSetKey
    branchByModelKeyByCoordKey = defaultdict(lambda: defaultdict(list))
    for importBranch in importBranches:
        branchByModelKeyByCoordKey[importBranch.modelSetKey][importBranch.coordSetKey] \
            .append(importBranch)

    # Define the converted importBranches
    convertedBranchesByCoordSetId: Dict[typing.Tuple[str, int, int], List[BranchTuple]] \
        = {}

    # Get the model set
    dbSession = CeleryDbConn.getDbSession()
    try:
        # Iterate through the importBranches and convert them
        for modelSetKey, item in branchByModelKeyByCoordKey.items():
            for coordSetKey, importBranches in item:
                modelSetId, coordSetId = coordSetIdByModelKeyCoordKeyTuple[
                    (modelSetKey, coordSetKey)]

                lookupHashConverter = LookupHashConverter(
                    dbSession, modelSetId, coordSetId
                )

                convertedBranches = []
                for importBranch in importBranches:
                    branch = BranchTuple.loadFromImportTuple(
                        importBranch, coordSetId,
                        lookupHashConverter=lookupHashConverter
                    )
                    convertedBranches.append(branch)

                convertedBranchesByCoordSetId[(modelSetKey, modelSetId, coordSetId)] \
                    = convertedBranches

    finally:
        dbSession.close()

    return convertedBranchesByCoordSetId


def _validateNewBranchIndexs(newBranches: List[ImportBranchTuple]) -> None:
    for branchIndex in newBranches:
        if not branchIndex.key:
            raise Exception("key is empty for %s" % branchIndex)

        if not branchIndex.modelSetKey:
            raise Exception("modelSetKey is empty for %s" % branchIndex)

        if not branchIndex.coordSetKey:
            raise Exception("coordSetKey is empty for %s" % branchIndex)
