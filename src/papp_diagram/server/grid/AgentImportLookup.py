import logging

from twisted.internet import defer

from peek.core.orm import getNovaOrmSession
from peek.core.orm.ModelSet import getOrCreateModelSet, \
    getOrCreateCoordSet
from rapui.vortex.Tuple import TUPLE_TYPES_BY_NAME

logger = logging.getLogger(__name__)


class AgentImportLookup:
    def import_(self, modelSetName, coordSetName,
                tupleType, tuples):
        # return deferToThread(self._blockingImport, modelSetName, coordSetName,
        #                      tupleType, tuples)
        self._blockingImport(modelSetName, coordSetName, tupleType, tuples)
        return defer.succeed(True)

    def _blockingImport(self, modelSetName, coordSetName,
                        tupleType, tuples):
        LookupType = TUPLE_TYPES_BY_NAME[tupleType]

        itemsByImportHash = {}

        session = getNovaOrmSession()

        modelSet = getOrCreateModelSet(session, modelSetName)
        coordSet = None

        if coordSetName:
            coordSet = getOrCreateCoordSet(session, modelSetName, coordSetName)

            all = (session.query(LookupType)
                   .filter(LookupType.coordSetId == coordSet.id)
                   .all())

        else:
            all = (session.query(LookupType)
                   .filter(LookupType.modelSetId == modelSet.id)
                   .all())

        def updateFks(lookup):
            if hasattr(lookup, "coordSetId"):
                assert coordSet
                lookup.coordSetId = coordSet.id
            else:
                lookup.modelSetId = modelSet.id

        addCount = 0
        updateCount = 0
        deleteCount = 0

        for lookup in all:
            # Initialise
            itemsByImportHash[lookup.importHash] = lookup

        for lookup in tuples:
            importHash = str(lookup.importHash)

            if importHash in itemsByImportHash:
                lookupId = itemsByImportHash.pop(importHash).id
                lookup.id = lookupId
                updateFks(lookup)
                session.merge(lookup)
                updateCount += 1


            else:
                updateFks(lookup)
                session.add(lookup)
                addCount += 1

        for lookup in list(itemsByImportHash.values()):
            session.delete(lookup)
            deleteCount += 1

        try:
            session.commit()
        except Exception as e:
            print(e)
            raise e
        session.close()

        logger.info("Updates for %s received, Added %s, Updated %s, Deleted %s",
                    tupleType, addCount, updateCount, deleteCount)
