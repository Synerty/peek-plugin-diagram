import logging
from datetime import datetime
from typing import List, Dict

from collections import defaultdict
from twisted.internet.defer import DeferredList, Deferred

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.client.controller.GridCacheController import \
    GridCacheController
from peek_plugin_diagram._private.server.client_handlers.RpcForClient import RpcForClient
from vortex.DeferUtil import vortexLogFailure
from vortex.Payload import Payload
from vortex.PayloadEndpoint import PayloadEndpoint
from vortex.VortexABC import SendVortexMsgResponseCallable
from vortex.VortexFactory import VortexFactory

logger = logging.getLogger(__name__)

clientGridWatchUpdateFromDeviceFilt = {'key': "clientGridWatchUpdateFromDevice"}
clientGridWatchUpdateFromDeviceFilt.update(diagramFilt)

#: This the type of the data that we get when the clients observe new grids.
DeviceGridT = Dict[str, datetime]


# ModelSet HANDLER
class GridCacheHandler(object):
    def __init__(self, gridCacheController: GridCacheController, clientId: str):
        """ App Grid Handler

        This class handles the custom needs of the desktop/mobile apps observing grids.

        """
        self._gridCacheController = gridCacheController
        self._clientId = clientId

        self._epObserve = PayloadEndpoint(
            clientGridWatchUpdateFromDeviceFilt, self._processObserve
        )

        self._observedGridKeysByVortexUuid = defaultdict(list)
        self._observedVortexUuidsByGridKey = defaultdict(list)

    def shutdown(self):
        self._epObserve.shutdown()
        self._epObserve = None

    # ---------------
    # Filter out offline vortexes

    def _filterOutOfflineVortexes(self):
        # TODO, Change this to observe offline vortexes
        # This depends on the VortexFactory offline observable implementation.
        # Which is incomplete at this point :-|

        vortexUuids = set(VortexFactory.getRemoteVortexUuids())
        vortexUuidsToRemove = set(self._observedGridKeysByVortexUuid) - vortexUuids

        if not vortexUuidsToRemove:
            return

        for vortexUuid in vortexUuidsToRemove:
            del self._observedGridKeysByVortexUuid[vortexUuid]

        self._rebuildStructs()

    # ---------------
    # Process update from the server

    def notifyOfGridUpdate(self, gridKeys: List[str]):
        """ Notify of Grid Updates

        This method is called by the client.GridCacheController when it receives updates
        from the server.

        """
        self._filterOutOfflineVortexes()

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
            payload.filt = clientGridWatchUpdateFromDeviceFilt

            # Serliase in thread, and then send.
            d = payload.toVortexMsgDefer()
            d.addCallback(VortexFactory.sendVortexMsg, destVortexUuid=vortexUuid)
            dl.append(d)

        # Log the errors, otherwise we don't care about them
        dl = DeferredList(dl, fireOnOneErrback=True)
        dl.addErrback(vortexLogFailure, logger, consumeError=True)

    # ---------------
    # Process observes from the devices

    def _processObserve(self, payload: Payload,
                        vortexUuid: str,
                        sendResponse: SendVortexMsgResponseCallable,
                        **kwargs):

        lastUpdateByGridKey: DeviceGridT = payload.tuples[0]
        gridKeys = list(lastUpdateByGridKey.keys())

        self._observedGridKeysByVortexUuid[vortexUuid] = gridKeys
        self._rebuildStructs()

        self._replyToObserve(payload.filt,
                             lastUpdateByGridKey,
                             sendResponse)

    def _rebuildStructs(self) -> None:
        """ Rebuild Structs

        Rebuild the reverse index of uuids by grid key.

        :returns: None
        """
        # Rebuild the other reverse lookup
        newDict = defaultdict(list)

        for vortexUuid, gridKeys in self._observedGridKeysByVortexUuid.items():
            for gridKey in gridKeys:
                newDict[gridKey].append(vortexUuid)

        keysChanged = set(self._observedVortexUuidsByGridKey) != set(newDict)

        self._observedVortexUuidsByGridKey = newDict

        # Notify the server that this client service is watching different grids.
        if keysChanged:
            d = RpcForClient.updateClientWatchedGrids(
                clientId=self._clientId,
                gridKeys=list(self._observedVortexUuidsByGridKey)
            )
            d.addErrback(vortexLogFailure, logger, consumeError=False)

    # ---------------
    # Reply to device observe

    def _replyToObserve(self, filt,
                        lastUpdateByGridKey: DeviceGridT,
                        sendResponse: SendVortexMsgResponseCallable) -> None:
        """ Reply to Observe

        The client has told us that it's observing a new set of grids, and the lastUpdate
        it has for each of those grids. We will send them the grids that are out of date
        or missing.

        :param filt: The payload filter to respond to.
        :param lastUpdateByGridKey: The dict of gridKey:lastUpdate
        :param sendResponse: The callable provided by the Vortex (handy)
        :returns: None

        """

        gridTuplesToSend = []

        # Check and send any updates
        for gridKey, lastUpdate in lastUpdateByGridKey.items():
            # NOTE: lastUpdate can be null.
            gridTuple = self._gridCacheController.grid(gridKey)
            if not gridTuple:
                logger.debug("Grid %s is not in the cache" % gridKey)
                continue

            # We are king, If it's it's not our version, it's the wrong version ;-)
            logger.debug("%s, %s,  %s", gridTuple.lastUpdate == lastUpdate,
                         gridTuple.lastUpdate , lastUpdate)
            if gridTuple.lastUpdate == lastUpdate:
                logger.debug("Grid %s matches the cache" % gridKey)
            else:
                gridTuplesToSend.append(gridTuple)
                logger.debug("Sending grid %s from the cache" % gridKey)

        if not gridTuplesToSend:
            return

        d: Deferred = Payload(filt=filt, tuples=gridTuplesToSend).toVortexMsgDefer()
        d.addCallback(sendResponse)
        d.addErrback(vortexLogFailure, logger, consumeError=True)