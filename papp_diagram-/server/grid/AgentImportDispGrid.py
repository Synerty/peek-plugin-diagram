import logging
from base64 import b64decode
from datetime import datetime

import shapely
from geoalchemy2.shape import from_shape
from peek.core.orm import getNovaOrmSession, prefetchDeclarativeIds
from peek.core.orm.Display import DispBase
from peek.core.orm.ModelSet import getOrCreateCoordSet
from twisted.internet.defer import inlineCallbacks, returnValue
from twisted.internet.task import coiterate

from txhttputil import convertFromWkbElement
from txhttputil import deferToThreadWrap

logger = logging.getLogger(__name__)


class AgentImportDispGrid:
    """ Agent Import Display
    """

    @inlineCallbacks
    def importDisps(self, modelSetName, coordSetName, importGroupHash, disps):
        """ Import Disps

        1) Use the AgentImportDispGridLookup to convert lookups from importHash
            to id
        2) set the  coordSetId

        This is not done in a thread because the lookups cause issues

        """

        session = getNovaOrmSession()

        from peek.core.data_cache.DispLookupDataCache import dispLookupDataCache

        coordSetId = getOrCreateCoordSet(session, modelSetName, coordSetName).id

        dispIdsToCompile = []

        dispIdGen = prefetchDeclarativeIds(DispBase, len(disps), session)
        session.commit()
        session.close()

        def process():
            for disp in disps:
                disp.id = next(dispIdGen)
                disp.coordSetId = coordSetId
                disp.dispJson = {}

                # Make a copy of the pre converted values for when the LiveDbKey needs
                # creating
                for dispLink in disp.importLiveDbDispLinks:
                    attrName = dispLink.dispAttrName
                    setattr(disp, attrName + 'Before', getattr(disp, attrName))

                # Convert the values of the liveDb attributes
                valueTranslator = dispLookupDataCache.getHandler(coordSetId)
                valueTranslator.convertLookups(disp)

                # Convert the WKBElement from dumped shape
                geomWkbData = from_shape(shapely.wkb.loads(b64decode(disp.geom)))
                disp.geom = geomWkbData.desc
                disp.geomWkbData = geomWkbData

                dispIdsToCompile.append(disp.id)
                yield None

        yield coiterate(process())
        yield self._importDisps(modelSetName, coordSetName, importGroupHash,
                                disps, dispIdsToCompile)

        returnValue((coordSetId, dispIdsToCompile))

    @deferToThreadWrap
    def _importDisps(self, modelSetName, coordSetName, importGroupHash,
                     disps, dispIdsToCompile):

        startTime = datetime.utcnow()
        logger.debug("Loaded lookups in %s", (datetime.utcnow() - startTime))

        session = getNovaOrmSession()

        (session.query(DispBase)
         .filter(DispBase.importGroupHash == importGroupHash)
         .delete())

        session = getNovaOrmSession()
        coordSet = getOrCreateCoordSet(session, modelSetName, coordSetName)
        coordSetId = coordSet.id

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

        session.commit()

        try:
            with session.begin(subtransactions=True):
                session.bulk_save_objects(disps, update_changed_only=False)
            session.commit()
            session.close()

            logger.debug("Finised inserting %s Disps in %s",
                         len(disps), (datetime.utcnow() - startTime))

        except Exception as e:
            logger.critical(e)
            session.rollback()
            session.close()
            raise
