import logging
from datetime import datetime
from typing import List, Dict

from collections import defaultdict
from twisted.internet.defer import DeferredList, Deferred

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.client.controller.LocationIndexCacheController import \
    LocationIndexCacheController
from peek_plugin_diagram._private.server.client_handlers.ClientLocationIndexLoaderRpc import ClientLocationIndexLoaderRpc
from peek_plugin_diagram._private.tuples.LocationIndexUpdateDateTuple import \
    LocationIndexUpdateDateTuple
from vortex.DeferUtil import vortexLogFailure
from vortex.Payload import Payload
from vortex.PayloadEndpoint import PayloadEndpoint
from vortex.VortexABC import SendVortexMsgResponseCallable
from vortex.VortexFactory import VortexFactory

logger = logging.getLogger(__name__)

clientLocationIndexWatchUpdateFromDeviceFilt = {
    'key': "clientLocationIndexWatchUpdateFromDevice"
}
clientLocationIndexWatchUpdateFromDeviceFilt.update(diagramFilt)

#: This the type of the data that we get when the clients observe new locationIndexs.
DeviceLocationIndexT = Dict[str, datetime]


# ModelSet HANDLER
class LocationIndexCacheHandler(object):
    def __init__(self, locationIndexCacheController: LocationIndexCacheController,
                 clientId: str):
        """ App LocationIndex Handler

        This class handles the custom needs of the desktop/mobile apps observing locationIndexs.

        """
        self._cacheController = locationIndexCacheController
        self._clientId = clientId

        self._epObserve = PayloadEndpoint(
            clientLocationIndexWatchUpdateFromDeviceFilt, self._processObserve
        )

        self._observedLocationIndexKeysByVortexUuid = defaultdict(list)
        self._observedVortexUuidsByLocationIndexKey = defaultdict(list)

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
        vortexUuidsToRemove = set(self._observedLocationIndexKeysByVortexUuid) - vortexUuids

        if not vortexUuidsToRemove:
            return

        for vortexUuid in vortexUuidsToRemove:
            del self._observedLocationIndexKeysByVortexUuid[vortexUuid]

        self._rebuildStructs()

    # ---------------
    # Process update from the server

    def notifyOfLocationIndexUpdate(self, locationIndexKeys: List[str]):
        """ Notify of LocationIndex Updates

        This method is called by the client.LocationIndexCacheController when it receives updates
        from the server.

        """
        self._filterOutOfflineVortexes()

        payloadsByVortexUuid = defaultdict(Payload)

        for locationIndexKey in locationIndexKeys:

            locationIndexTuple = self._cacheController.locationIndex(locationIndexKey)
            vortexUuids = self._observedVortexUuidsByLocationIndexKey.get(locationIndexKey, [])

            # Queue up the required client notifications
            for vortexUuid in vortexUuids:
                logger.debug("Sending unsolicited locationIndex %s to vortex %s",
                             locationIndexKey, vortexUuid)
                payloadsByVortexUuid[vortexUuid].tuples.append(locationIndexTuple)

        # Send the updates to the clients
        dl = []
        for vortexUuid, payload in list(payloadsByVortexUuid.items()):
            payload.filt = clientLocationIndexWatchUpdateFromDeviceFilt

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

        updateDatesTuples: LocationIndexUpdateDateTuple = payload.tuples[0]
        locationIndexKeys = list(lastUpdateByLocationIndexKey.keys())

        self._observedLocationIndexKeysByVortexUuid[vortexUuid] = locationIndexKeys
        self._rebuildStructs()

        self._replyToObserve(payload.filt,
                             lastUpdateByLocationIndexKey,
                             sendResponse)

    def _rebuildStructs(self) -> None:
        """ Rebuild Structs

        Rebuild the reverse index of uuids by locationIndex key.

        :returns: None
        """
        # Rebuild the other reverse lookup
        newDict = defaultdict(list)

        for vortexUuid, locationIndexKeys in self._observedLocationIndexKeysByVortexUuid.items():
            for locationIndexKey in locationIndexKeys:
                newDict[locationIndexKey].append(vortexUuid)

        keysChanged = set(self._observedVortexUuidsByLocationIndexKey) != set(newDict)

        self._observedVortexUuidsByLocationIndexKey = newDict


    # ---------------
    # Reply to device observe

    def _replyToObserve(self, filt,
                        lastUpdateByLocationIndexKey: DeviceLocationIndexT,
                        sendResponse: SendVortexMsgResponseCallable) -> None:
        """ Reply to Observe

        The client has told us that it's observing a new set of locationIndexs, and the lastUpdate
        it has for each of those locationIndexs. We will send them the locationIndexs that are out of date
        or missing.

        :param filt: The payload filter to respond to.
        :param lastUpdateByLocationIndexKey: The dict of locationIndexKey:lastUpdate
        :param sendResponse: The callable provided by the Vortex (handy)
        :returns: None

        """

        locationIndexTuplesToSend = []

        # Check and send any updates
        for locationIndexKey, lastUpdate in lastUpdateByLocationIndexKey.items():
            # NOTE: lastUpdate can be null.
            locationIndexTuple = self._cacheController.locationIndex(locationIndexKey)
            if not locationIndexTuple:
                logger.debug("LocationIndex %s is not in the cache" % locationIndexKey)
                continue

            # We are king, If it's it's not our version, it's the wrong version ;-)
            logger.debug("%s, %s,  %s", locationIndexTuple.lastUpdate == lastUpdate,
                         locationIndexTuple.lastUpdate, lastUpdate)
            if locationIndexTuple.lastUpdate == lastUpdate:
                logger.debug("LocationIndex %s matches the cache" % locationIndexKey)
            else:
                locationIndexTuplesToSend.append(locationIndexTuple)
                logger.debug("Sending locationIndex %s from the cache" % locationIndexKey)

        if not locationIndexTuplesToSend:
            return

        d: Deferred = Payload(filt=filt, tuples=locationIndexTuplesToSend).toVortexMsgDefer()
        d.addCallback(sendResponse)
        d.addErrback(vortexLogFailure, logger, consumeError=True)
