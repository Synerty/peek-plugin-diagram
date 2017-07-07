import logging

from twisted.internet.defer import inlineCallbacks

from peek_plugin_base.client.PluginClientEntryHookABC import PluginClientEntryHookABC
from peek_plugin_diagram._private.client.TupleDataObservable import \
    makeClientTupleDataObservableHandler
from peek_plugin_diagram._private.client.controller.GridCacheController import \
    GridCacheController
from peek_plugin_diagram._private.client.handlers.GridCacheHandler import GridCacheHandler

from peek_plugin_diagram._private.client.controller.LookupCacheController import \
    LookupCacheController
from peek_plugin_diagram._private.storage.DeclarativeBase import loadStorageTuples
from peek_plugin_diagram._private.tuples import loadPrivateTuples
from peek_plugin_diagram.tuples import loadPublicTuples
from .DeviceTupleDataObservableProxy import makeDeviceTupleDataObservableProxy
from .DeviceTupleProcessorActionProxy import makeTupleActionProcessorProxy

logger = logging.getLogger(__name__)


class ClientEntryHook(PluginClientEntryHookABC):
    def __init__(self, *args, **kwargs):
        """" Constructor """
        # Call the base classes constructor
        PluginClientEntryHookABC.__init__(self, *args, **kwargs)

        #: Loaded Objects, This is a list of all objects created when we start
        self._loadedObjects = []

    def load(self) -> None:
        """ Load

        This will be called when the plugin is loaded, just after the db is migrated.
        Place any custom initialiastion steps here.

        """

        loadStorageTuples()

        loadPrivateTuples()
        loadPublicTuples()

        logger.debug("Loaded")

    @inlineCallbacks
    def start(self):
        """ Load

        This will be called when the plugin is loaded, just after the db is migrated.
        Place any custom initialiastion steps here.

        """

        self._loadedObjects.append(makeTupleActionProcessorProxy())

        self._loadedObjects.append(makeDeviceTupleDataObservableProxy())

        gridCacheController = GridCacheController(self.platform.serviceId)
        self._loadedObjects.append(gridCacheController)

        # This is the custom handler for the client
        gridCacheHandler = GridCacheHandler(gridCacheController)
        self._loadedObjects.append(gridCacheHandler)

        gridCacheController.setGridCacheHandler(gridCacheHandler)

        lookupCacheController = LookupCacheController()
        self._loadedObjects.append(lookupCacheController)

        # Create the Tuple Observer
        tupleObservable = makeClientTupleDataObservableHandler(lookupCacheController)
        self._loadedObjects.append(tupleObservable)

        lookupCacheController.setTupleObserable(tupleObservable)

        yield gridCacheController.start()
        yield lookupCacheController.start()

        logger.debug("Started")

    def stop(self):
        """ Stop

        This method is called by the platform to tell the peek app to shutdown and stop
        everything it's doing
        """
        # Shutdown and dereference all objects we constructed when we started
        while self._loadedObjects:
            self._loadedObjects.pop().shutdown()

        logger.debug("Stopped")

    def unload(self):
        """Unload

        This method is called after stop is called, to unload any last resources
        before the PLUGIN is unlinked from the platform

        """
        logger.debug("Unloaded")
