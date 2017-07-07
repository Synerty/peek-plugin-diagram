import logging
from datetime import datetime
from typing import List, Iterable, Dict

from twisted.internet.defer import inlineCallbacks

from peek_plugin_diagram._private.storage.LiveDbDispLink import LiveDbDispLink, \
    LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram.tuples.model.ImportLiveDbDispLinkTuple import \
    ImportLiveDbDispLinkTuple
from peek_plugin_livedb.server.LiveDBWriteApiABC import LiveDBWriteApiABC
from peek_plugin_livedb.tuples.ImportLiveDbItemTuple import ImportLiveDbItemTuple
from vortex.DeferUtil import deferToThreadWrapWithLogger

logger = logging.getLogger(__name__)


class DispLinkImportController:
    """ Disp Link Import Controller
    """

    def __init__(self, dbSessionCreator, getPgSequenceGenerator,
                 liveDbWriteApi: LiveDBWriteApiABC):
        self._dbSessionCreator = dbSessionCreator
        self._getPgSequenceGenerator = getPgSequenceGenerator
        self._liveDbWriteApi = liveDbWriteApi

    def shutdown(self):
        pass

    @inlineCallbacks
    def importDispLiveDbDispLinks(self, modelSetName: str,
                                  coordSet: ModelCoordSet,
                                  importGroupHash: str,
                                  importDispLinks: List[ImportLiveDbDispLinkTuple]):

        dispLinkIdIterator = yield self._getPgSequenceGenerator(
            LiveDbDispLink, len(importDispLinks)
        )

        liveDbItemsToImport = yield self._importDispLinks(
            coordSet, importGroupHash, importDispLinks, dispLinkIdIterator
        )

        if liveDbItemsToImport:
            yield self._liveDbWriteApi.importLiveDbItems(modelSetName,
                                                     liveDbItemsToImport)

    @deferToThreadWrapWithLogger(logger)
    def _importDispLinks(self, coordSet: ModelCoordSet,
                         importGroupHash: str,
                         importDispLinks: List[ImportLiveDbDispLinkTuple],
                         dispLinkIdIterator: Iterable[int]):
        """ Import Disps Links

        1) Drop all disps with matching importGroupHash

        2) set the  coordSetId

        :param coordSet:
        :param importGroupHash:
        :param importDispLinks: An array of import LiveDB Disp Links to import
        :return:
        """

        startTime = datetime.utcnow()

        ormSession = self._dbSessionCreator()
        try:

            (ormSession.query(LiveDbDispLink)
             .filter(LiveDbDispLink.importGroupHash == importGroupHash)
             .delete())
            ormSession.commit()

            if not importDispLinks:
                return

            liveDbItemsToImportByKey = {}

            dispLinkInserts = []

            for importDispLink in importDispLinks:
                dispLink = self._convertImportDispLinkTuple(coordSet, importDispLink)
                dispLink.id = next(dispLinkIdIterator)

                liveDbItem = self._makeImportLiveDbItem(
                    importDispLink, liveDbItemsToImportByKey
                )

                dispLink.liveDbKey = liveDbItem.key
                dispLinkInserts.append(dispLink.tupleToSqlaBulkInsertDict())

            if dispLinkInserts:
                logger.info("Inserting %s LiveDbDispLink(s)", len(dispLinkInserts))
                ormSession.execute(LiveDbDispLink.__table__.insert(), dispLinkInserts)

            ormSession.commit()

            logger.info(
                "Comitted %s LiveDbDispLinks in %s",
                len(dispLinkInserts), (datetime.utcnow() - startTime)
            )

            return list(liveDbItemsToImportByKey.values())

        except Exception as e:
            ormSession.rollback()
            logger.critical(e)
            raise

        finally:
            ormSession.close()

    def _convertImportDispLinkTuple(self, coordSet: ModelCoordSet,
                                    importDispLink: ImportLiveDbDispLinkTuple
                                    ) -> LiveDbDispLink:
        return LiveDbDispLink(
            dispId=importDispLink.dispId,  # Dynamically added in DispImportController
            coordSetId=coordSet.id,
            dispAttrName=importDispLink.dispAttrName,
            liveDbKey=importDispLink.liveDbKey,
            importGroupHash=importDispLink.importGroupHash,
            props=importDispLink.props
        )

    def _makeImportLiveDbItem(self, importDispLink: ImportLiveDbDispLinkTuple,
                              liveDbItemsToImportByKey: Dict):

        if importDispLink.liveDbKey in liveDbItemsToImportByKey:
            return liveDbItemsToImportByKey[importDispLink.liveDbKey]

        dataType = LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR[importDispLink.dispAttrName]

        # These are not defined on the tuple, they are added in DispImportController
        rawValue = importDispLink.liveDbRawValue
        displayValue = importDispLink.liveDbDisplayValue

        newLiveDbKey = ImportLiveDbItemTuple(dataType=dataType,
                                             rawValue=rawValue,
                                             displayValue=displayValue,
                                             key=importDispLink.liveDbKey)

        liveDbItemsToImportByKey[importDispLink.liveDbKey] = newLiveDbKey

        return newLiveDbKey
