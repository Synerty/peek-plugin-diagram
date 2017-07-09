from typing import List

from collections import defaultdict
from copy import copy
from twisted.internet.defer import DeferredList
from twisted.internet.threads import deferToThread
from twisted.python.failure import Failure

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.client.controller.GridCacheController import \
    GridCacheController
from peek_plugin_diagram._private.server.client_handlers.RpcForClient import RpcForClient
from vortex.DeferUtil import vortexLogFailure
from vortex.Payload import Payload
from vortex.PayloadEndpoint import PayloadEndpoint
from vortex.VortexFactory import VortexFactory

__author__ = 'peek_server'
'''
Created on 09/07/2014

@author: synerty
'''

import logging

logger = logging.getLogger(__name__)

clientGridUpdateFromServerFilt = {'key': "query.grids"}
clientGridUpdateFromServerFilt.update(diagramFilt)

clientGridWatchUpdateFromDeviceFilt = {'key': "clientGridWatchUpdateFromDevice"}
clientGridWatchUpdateFromDeviceFilt.update(diagramFilt)


# ModelSet HANDLER
class GridCacheHandler(object):
    def __init__(self, gridCacheController: GridCacheController):
        """ App Grid Handler

        This class handles the custom needs of the desktop/mobile apps observing grids.

        """
        self._gridCacheController = gridCacheController

        self._epUpdateCheck = PayloadEndpoint(
            clientGridUpdateFromServerFilt, self._processUpdate
        )

        self._epObserve = PayloadEndpoint(
            clientGridWatchUpdateFromDeviceFilt, self._processObserve
        )

        self._observedGridKeysByVortexUuid = defaultdict(list)
        self._observedVortexUuidsByGridKey = defaultdict(list)

    def shutdown(self):
        self._epUpdateCheck.shutdown()
        self._epUpdateCheck = None

        self._epObserve.shutdown()
        self._epObserve = None

    def _processObserve(self, payload, vortexUuid, **kwargs):
        self._observedGridKeysByVortexUuid[vortexUuid] = payload.filt["gridKeys"]

        self._observedVortexUuidsByGridKey = defaultdict(list)

        for vortexUuid, gridKeys in list(self._observedGridKeysByVortexUuid.items()):
            for gridKey in gridKeys:
                self._observedVortexUuidsByGridKey[gridKey].append(vortexUuid)

        d = RpcForClient.updateClientWatchedGrids(
            list(self._observedVortexUuidsByGridKey)
        )
        d.addErrback(vortexLogFailure, logger, consumeError=False)

    def notifyOfGridUpdate(self, gridKeys: List[str]):
        payloadsByVortexUuid = defaultdict(Payload)

        for gridKey in gridKeys:

            gridTuple = self._gridCacheController.grid(gridKey)
            vortexUuids = self._observedVortexUuidsByGridKey.get(gridKey, [])

            # Queue up the required client notifications
            for vortexUuid in vortexUuids:
                payloadsByVortexUuid[vortexUuid].tuples.append(gridTuple)

        # Send the updates to the clients
        dl = []
        for vortexUuid, payload in list(payloadsByVortexUuid.items()):
            payload.filt = clientGridUpdateFromServerFilt

            # Serliase in thread, and then send.
            d = payload.toVortexMsgDefer()
            d.addCallback(VortexFactory.sendVortexMsg, destVortexUuid=vortexUuid)
            dl.append(d)

        # Log the errors, otherwise we don't care about them
        dl = DeferredList(dl, fireOnOneErrback=True)
        dl.addErrback(vortexLogFailure, logger, consumeError=True)

    def _processUpdate(self, payload, vortexUuid, session, **kwargs):

        self.sendModelUpdate(vortexUuid=vortexUuid,
                             payloadFilt=payload.filt,
                             payloadReplyFilt=payload.replyFilt,
                             session=session)

    def sendModelUpdate(self, vortexUuid=None, payloadFilt=None, **kwargs):
        # Prefer reply filt, if not combine our accpt filt with the filt we were sent
        filt = copy(clientGridUpdateFromServerFilt)

        def sendBad(failure):
            VortexFactory.sendVortexMsg(
                Payload(result=str(failure.value)).toVortexMsg(),
                destVortexUuid=vortexUuid
            )
            return failure

        try:

            gridKeys = payloadFilt['grids']

            if not gridKeys:
                logger.debug("There are no grids requested for update, exiting")

            deferreds = []
            index = 0
            chunkSize = 10
            while True:
                gridKeysChunk = gridKeys[index:index + chunkSize]
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
        VortexFactory.sendVortexMsg(
            payload.toVortexMsg(),
            destVortexUuid=vortexUuid
        )

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

            gridCompiled = self._gridCacheController.grid(key)

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
