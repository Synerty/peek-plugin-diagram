import logging
from datetime import datetime

from peek.core.orm import getNovaOrmSession, getPgSequenceGenerator, SynSqlaConn
from peek.core.orm.LiveDb import LiveDbDispLink, LiveDbKey, \
    LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR
from peek.core.orm.ModelSet import ModelCoordSet

from txhttputil import deferToThreadWrap

logger = logging.getLogger(__name__)


class LiveDbImportController:
    """ LiveDB Import Controller
    """

    def __init__(self, dbSessionCreator):
        self._dbSessionCreator = dbSessionCreator

    @deferToThreadWrap
    def importDispLiveDbDispLinks(self, coordSetId, importGroupHash, disps):
        """ Import Disps

        1) set the  coordSetId

        2) Drop all disps with matching importGroupHash

        :param coordSetId:
        :param importGroupHash:
        :param disps:
        :return:
        """
        session = getNovaOrmSession()
        engine = SynSqlaConn.dbEngine

        startTime = datetime.utcnow()

        (session.query(LiveDbDispLink)
         .filter(LiveDbDispLink.importGroupHash == importGroupHash)
         .delete())
        session.commit()

        if not disps:
            session.close()
            return

        coordSet = (session.query(ModelCoordSet)
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
            qry = (session
                   .query(LiveDbKey.id, LiveDbKey.liveDbKey)
                   .filter(LiveDbKey.modelSetId == coordSet.modelSetId)
                   .filter(LiveDbKey.liveDbKey.in_(liveDbKeys)))

            liveDbKeyIdsByAgentKey = {i[1]: i[0] for i in qry}

        newLiveDbKeyCount = len(liveDbKeys) - len(liveDbKeyIdsByAgentKey)

        dispLinkIdGen = getPgSequenceGenerator(LiveDbDispLink, newDispLinkCount, session)
        liveDbKeyIdGen = getPgSequenceGenerator(LiveDbKey, newLiveDbKeyCount, session)

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

        session.close()

        conn = engine.connect()
        transaction = conn.begin()

        if liveDbKeyInserts:
            logger.info("Inserting %s LiveDbKey(s)", len(liveDbKeyInserts))
            conn.execute(LiveDbKey.__table__.insert(), liveDbKeyInserts)

        if dispLinkInserts:
            logger.info("Inserting %s LiveDbDispLink(s)", len(dispLinkInserts))
            conn.execute(LiveDbDispLink.__table__.insert(), dispLinkInserts)

        try:
            transaction.commit()
            logger.info("Comitted %s LiveDbKeys and %s LiveDbDispLinks in %s",
                        len(liveDbKeyInserts), len(dispLinkInserts),
                        (datetime.utcnow() - startTime))
            conn.close()

            return newLiveDbIds

        except Exception as e:
            transaction.rollback()
            logger.critical(e)
            conn.close()
            raise

    def getOrCreateLiveDbKeyId(self, modelSetId, disp, dispLink, liveDbKeyIdGen,
                               liveDbKeyIdsByAgentKey, liveDbKeyInserts, newLiveDbIds):

        liveDbKeyId = liveDbKeyIdsByAgentKey.get(dispLink.importKeyHash)

        # Create a new LiveDbKey
        if liveDbKeyId is not None:
            return liveDbKeyId

        dataType = LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR[dispLink.dispAttrName]

        # The value present in the disp obect is already converted/translated
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
