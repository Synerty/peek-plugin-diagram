import logging
from datetime import datetime


from peek_plugin_diagram._private.storage.LiveDb import LiveDbDispLink, LiveDbKey, \
    LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet

from vortex.DeferUtil import deferToThreadWrapWithLogger

logger = logging.getLogger(__name__)


class LiveDbImportController:
    """ LiveDB Import Controller
    """

    def __init__(self, dbSessionCreator, getPgSequenceGenerator):
        self._dbSessionCreator = dbSessionCreator
        self._getPgSequenceGenerator = getPgSequenceGenerator

    @deferToThreadWrapWithLogger(logger)
    def importDispLiveDbDispLinks(self, coordSetId, importGroupHash, disps):
        """ Import Disps

        1) set the  coordSetId

        2) Drop all disps with matching importGroupHash

        :param coordSetId:
        :param importGroupHash:
        :param disps:
        :return:
        """

        startTime = datetime.utcnow()

        ormSession = self._dbSessionCreator()
        try:

            (ormSession.query(LiveDbDispLink)
             .filter(LiveDbDispLink.importGroupHash == importGroupHash)
             .delete())
            ormSession.commit()

            if not disps:
                return

            coordSet = (ormSession.query(ModelCoordSet)
                        .filter(ModelCoordSet.id == coordSetId).one())

            newDispLinkCount = 0
            liveDbKeys = []
            for disp in disps:
                for dispLink in disp.importLiveDbDispLinks:
                    newDispLinkCount += 1
                    liveDbKeys.append(dispLink.importKeyHash)

            if not liveDbKeys:
                liveDbKeyIdsByAgentKey = {}

            else:
                qry = (ormSession
                       .query(LiveDbKey.id, LiveDbKey.liveDbKey)
                       .filter(LiveDbKey.modelSetId == coordSet.modelSetId)
                       .filter(LiveDbKey.liveDbKey.in_(liveDbKeys)))

                liveDbKeyIdsByAgentKey = {i[1]: i[0] for i in qry}

            newLiveDbKeyCount = len(liveDbKeys) - len(liveDbKeyIdsByAgentKey)

            dispLinkIdGen = self._getPgSequenceGenerator(LiveDbDispLink, newDispLinkCount, ormSession)
            liveDbKeyIdGen = self._getPgSequenceGenerator(LiveDbKey, newLiveDbKeyCount, ormSession)

            dispLinkInserts = []
            liveDbKeyInserts = []
            newLiveDbIds = []

            for disp in disps:
                for dispLink in disp.importLiveDbDispLinks:
                    dispLink.id = next(dispLinkIdGen)
                    dispLink.coordSetId = coordSet.id
                    dispLink.dispId = disp.id

                    liveDbKeyId = self.getOrCreateLiveDbKeyId(coordSet.modelSetId,
                                                              disp,
                                                              dispLink,
                                                              liveDbKeyIdGen,
                                                              liveDbKeyIdsByAgentKey,
                                                              liveDbKeyInserts,
                                                              newLiveDbIds)

                    dispLink.liveDbKeyId = liveDbKeyId
                    dispLinkInserts.append(dispLink.tupleToSqlaBulkInsertDict())


            if liveDbKeyInserts:
                logger.info("Inserting %s LiveDbKey(s)", len(liveDbKeyInserts))
                ormSession.execute(LiveDbKey.__table__.insert(), liveDbKeyInserts)

            if dispLinkInserts:
                logger.info("Inserting %s LiveDbDispLink(s)", len(dispLinkInserts))
                ormSession.execute(LiveDbDispLink.__table__.insert(), dispLinkInserts)

            ormSession.commit()

            logger.info("Comitted %s LiveDbKeys and %s LiveDbDispLinks in %s",
                        len(liveDbKeyInserts), len(dispLinkInserts),
                        (datetime.utcnow() - startTime))

            return newLiveDbIds

        except Exception as e:
            ormSession.rollback()
            logger.critical(e)
            raise

        finally:
            ormSession.close()

    def getOrCreateLiveDbKeyId(self, modelSetId, disp, dispLink, liveDbKeyIdGen,
                               liveDbKeyIdsByAgentKey, liveDbKeyInserts, newLiveDbIds):

        liveDbKeyId = liveDbKeyIdsByAgentKey.get(dispLink.importKeyHash)

        # Create a new LiveDbKey
        if liveDbKeyId is not None:
            return liveDbKeyId

        dataType = LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR[dispLink.dispAttrName]

        # The value present in the disp object is already converted/translated
        convertedValue = getattr(disp, dispLink.dispAttrName, None)
        value = getattr(disp, dispLink.dispAttrName + 'Before', None)

        newLiveDbKey = LiveDbKey(id=next(liveDbKeyIdGen),
                                 modelSetId=modelSetId,
                                 dataType=dataType,
                                 value=value,
                                 convertedValue=convertedValue,
                                 liveDbKey=dispLink.importKeyHash,
                                 importHash=dispLink.importKeyHash)
        newLiveDbIds.append(newLiveDbKey.id)
        liveDbKeyInserts.append(newLiveDbKey.tupleToSqlaBulkInsertDict())
        liveDbKeyId = newLiveDbKey.id
        liveDbKeyIdsByAgentKey[newLiveDbKey.liveDbKey] = newLiveDbKey.id

        return liveDbKeyId
