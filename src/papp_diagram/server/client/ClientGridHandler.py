from collections import defaultdict
from copy import copy
from datetime import datetime

from twisted.internet.defer import DeferredList
from twisted.internet.threads import deferToThread
from twisted.python.failure import Failure

from peek.core.orm.GridKeyIndex import GridKeyIndexCompiled
from peek.core.orm.ModelSet import ModelCoordSet
from rapui.vortex.Payload import Payload
from rapui.vortex.PayloadEndpoint import PayloadEndpoint
from rapui.vortex.Vortex import vortexSendVortexMsg, vortexSendPayload

__author__ = 'peek_server'
'''
Created on 09/07/2014

@author: synerty
'''

from peek.core.orm import getNovaOrmSession

import logging

logger = logging.getLogger(__name__)

clientGridUpdateCheckFilt = {'key': "repo.client.grid.update_check"}
clientGridObserveFilt = {'key': "repo.client.grid.observe"}
serverAddNewGridFilt = {'key': "repo.server.add_new_grid"}


# ModelSet HANDLER
class ClientGridHandler(object):
    def __init__(self):
        ''' Create Model Hanlder

        This handler will perform send a list of tuples built by buildModel

        '''

        self._epUpdateCheck = PayloadEndpoint(clientGridUpdateCheckFilt,
                                              self._processUpdate)

        self._epObserve = PayloadEndpoint(clientGridObserveFilt,
                                          self._processObserve)

        self._epNewGrid = PayloadEndpoint(serverAddNewGridFilt,
                                          self._processNewGrids)

        self._observedGridKeysByVortexUuid = defaultdict(list)
        self._observedVortexUuidsByGridKey = defaultdict(list)
        self._gridCache = {}
        self._cachedGridCoordSetIds = set()

    def start(self):
        self.reload()

    def reload(self):
        startTime = datetime.utcnow()
        logger.info("Caching compiled grids")
        session = getNovaOrmSession()

        enabledCoordSetIds = set([o[0] for o in session
                                 .query(ModelCoordSet.id)
                                 .filter(ModelCoordSet.enabled == True)
                                 .all()])

        if self._cachedGridCoordSetIds == enabledCoordSetIds:
            logger.info("Caching update is not required")
            return

        qry = (session
               .query(GridKeyIndexCompiled)
               .filter(GridKeyIndexCompiled.coordSetId.in_(enabledCoordSetIds))
               .yield_per(1000))

        self._gridCache = {g.gridKey: g for g in qry}
        session.expunge_all()
        session.close()

        self._cachedGridCoordSetIds = enabledCoordSetIds

        logger.info("Caching completed in %s", datetime.utcnow() - startTime)

    def _processObserve(self, payload, vortexUuid, **kwargs):
        self._observedGridKeysByVortexUuid[vortexUuid] = payload.filt["gridKeys"]

        self._observedVortexUuidsByGridKey = defaultdict(list)

        for vortexUuid, gridKeys in list(self._observedGridKeysByVortexUuid.items()):
            for gridKey in gridKeys:
                self._observedVortexUuidsByGridKey[gridKey].append(vortexUuid)

        from peek.core.live_db.LiveDb import liveDb
        liveDb.setWatchedGridKeys(list(self._observedVortexUuidsByGridKey))

    def _processNewGrids(self, payload, *args, **kwargs):
        self.addCacheNewGrids(payload.tuples)

    def addCacheNewGrids(self, gridKeyIndexCompileds):
        payloadsByVortexUuid = defaultdict(Payload)

        for compiledGrid in gridKeyIndexCompileds:
            if not compiledGrid.coordSetId in self._cachedGridCoordSetIds:
                continue

            self._gridCache[compiledGrid.gridKey] = compiledGrid
            vortexUuids = self._observedVortexUuidsByGridKey.get(compiledGrid.gridKey, [])

            # Queue up the required client notifications
            for vortexUuid in vortexUuids:
                payloadsByVortexUuid[vortexUuid].tuples.append(compiledGrid)

        # Send the updates to the clients
        for vortexUuid, payload in list(payloadsByVortexUuid.items()):
            payload.filt = clientGridUpdateCheckFilt
            vortexSendPayload(payload, vortexUuid=vortexUuid)

    def _processUpdate(self, payload, vortexUuid, session, **kwargs):
        from peek.AppConfig import appConfig
        if appConfig.capabilities['demoExceeded']:
            logger.error("Refusing to serve grid data, licence has expired")
            return

        self.sendModelUpdate(vortexUuid=vortexUuid,
                             payloadFilt=payload.filt,
                             payloadReplyFilt=payload.replyFilt,
                             session=session)

    def sendModelUpdate(self, vortexUuid=None, payloadFilt=None, **kwargs):
        # Prefer reply filt, if not combine our accpt filt with the filt we were sent
        filt = copy(clientGridUpdateCheckFilt)

        def sendBad(failure):
            vortexSendPayload(Payload(result=str(failure.value)), vortexUuid)
            return failure

        try:

            grids = payloadFilt['grids']

            if not grids:
                logger.debug("There are no grids requested for update, exiting")

            deferreds = []
            index = 0
            chunkSize = 10
            while True:
                gridKeysChunk = grids[index:index + chunkSize]
                if not gridKeysChunk:
                    break

                index += chunkSize
                d = deferToThread(self._query, copy(filt),
                                  gridKeysChunk, vortexUuid)
                deferreds.append(d)

            dl = DeferredList(deferreds, fireOnOneErrback=True)
            dl.addErrback(sendBad)

        except Exception as e:
            sendBad(Failure(e))
            raise

    def _query(self, filt, clientGrids, vortexUuid):
        payload = self.queryForPayload(filt, clientGrids)
        vortexSendVortexMsg(payload.toVortexMsg(), vortexUuid=vortexUuid)

    def queryForPayload(self, filt, clientGrids):
        """ Query for Payload

        This method generates the payload to send to the client.
        We don't actually send the data to the client as the generated payload is also
        used to send via the JSON resource.

        :return: payload with data to send
        """

        clientLastUpdateByGridKey = {i['gridKey']: i.get('lastUpdate')
                                     for i in clientGrids}

        gridsToSend = []
        missingGridKeys = []

        for key, cDate in list(clientLastUpdateByGridKey.items()):

            gridCompiled = self._gridCache.get(key)

            if not gridCompiled:
                missingGridKeys.append(key)
                continue

            sDate = gridCompiled.lastUpdate

            # If the server and client disagree, send an update
            # Strip the microseconds off, javascript truncates these and it doesn't match
            if str(sDate)[:-3] != str(cDate)[:-3]:
                gridsToSend.append(gridCompiled)

                # ELSE, It's up to date, which means we don't query for it and don't send it

        filt['gridKeys'] = list(clientLastUpdateByGridKey.keys())
        payload = Payload(filt=filt, tuples=gridsToSend)

        if missingGridKeys:
            logger.debug("Grid keys missing %s", ','.join(missingGridKeys))

        if gridsToSend:
            logger.debug("Grid key needing update %s",
                         ','.join([g.gridKey for g in gridsToSend]))

        logger.debug("%s grids asked for, %s updates needed, %s don't exist"
                     % (len(clientGrids),
                        len(gridsToSend), len(missingGridKeys)))

        return payload


clientGridHandler = ClientGridHandler()
