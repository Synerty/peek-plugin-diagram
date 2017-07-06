import logging

from celery import Celery
from twisted.internet.defer import inlineCallbacks

from peek_plugin_base.server.PluginServerEntryHookABC import PluginServerEntryHookABC
from peek_plugin_base.server.PluginServerStorageEntryHookABC import \
    PluginServerStorageEntryHookABC
from peek_plugin_base.server.PluginServerWorkerEntryHookABC import \
    PluginServerWorkerEntryHookABC
from peek_plugin_diagram._private.server.cache.DispLookupDataCache import \
    DispLookupDataCache
from peek_plugin_diagram._private.server.controller.DispImportController import \
    DispImportController
from peek_plugin_diagram._private.server.controller.DispLinkImportController import \
    DispLinkImportController
from peek_plugin_diagram._private.server.controller.LookupImportController import \
    LookupImportController
from peek_plugin_diagram._private.server.queue.DispCompilerQueue import DispCompilerQueue
from peek_plugin_diagram._private.server.queue.GridKeyCompilerQueue import \
    GridKeyCompilerQueue
from peek_plugin_diagram._private.storage import DeclarativeBase
from peek_plugin_diagram._private.storage.DeclarativeBase import loadStorageTuples
from peek_plugin_diagram._private.tuples import loadPrivateTuples
from peek_plugin_diagram.tuples import loadPublicTuples
from peek_plugin_livedb.server.LiveDBApiABC import LiveDBApiABC
from .DiagramApi import DiagramApi
from .TupleActionProcessor import makeTupleActionProcessorHandler
from .TupleDataObservable import makeTupleDataObservableHandler
from .admin_backend import makeAdminBackendHandlers
from .controller.MainController import MainController

logger = logging.getLogger(__name__)


class ServerEntryHook(PluginServerEntryHookABC,
                      PluginServerStorageEntryHookABC,
                      PluginServerWorkerEntryHookABC):
    def __init__(self, *args, **kwargs):
        """" Constructor """
        # Call the base classes constructor
        PluginServerEntryHookABC.__init__(self, *args, **kwargs)

        #: Loaded Objects, This is a list of all objects created when we start
        self._loadedObjects = []

        self._api = None

    def load(self) -> None:
        """ Load

        This will be called when the plugin is loaded, just after the db is migrated.
        Place any custom initialiastion steps here.

        """
        loadStorageTuples()
        loadPrivateTuples()
        loadPublicTuples()
        logger.debug("Loaded")

    @property
    def dbMetadata(self):
        return DeclarativeBase.metadata

    @inlineCallbacks
    def start(self):
        """ Start

        This will be called when the plugin is loaded, just after the db is migrated.
        Place any custom initialisation steps here.

        """

        # Create the GRID KEY queue
        gridKeyCompilerQueue = GridKeyCompilerQueue(self.dbSessionCreator)
        self._loadedObjects.append(gridKeyCompilerQueue)

        # Create the DISP queue
        dispCompilerQueue = DispCompilerQueue(
            self.dbSessionCreator, gridKeyCompilerQueue
        )
        self._loadedObjects.append(dispCompilerQueue)

        # Create the LOOKUP cachec
        dispLookupCache = DispLookupDataCache(self.dbSessionCreator)
        self._loadedObjects.append(dispLookupCache)

        # Create the Tuple Observer
        tupleObservable = makeTupleDataObservableHandler(self.dbSessionCreator)
        self._loadedObjects.append(tupleObservable)

        # Initialise the handlers for the admin interface
        self._loadedObjects.extend(
            makeAdminBackendHandlers(tupleObservable, self.dbSessionCreator)
        )

        # create the Main Controller
        mainController = MainController(
            dbSessionCreator=self.dbSessionCreator,
            tupleObservable=tupleObservable)
        self._loadedObjects.append(mainController)

        # Create the Action Processor
        self._loadedObjects.append(makeTupleActionProcessorHandler(mainController))

        # Create the import lookup controller
        lookupImportController = LookupImportController(
            dbSessionCreator=self.dbSessionCreator,
            dispLookupCache=dispLookupCache
        )
        self._loadedObjects.append(lookupImportController)

        # Create the Live DB Controller
        liveDbApi: LiveDBApiABC = self.platform.getOtherPluginApi("peek_plugin_livedb")

        # Create the Live DB Import Controller
        dispLinkImportController = DispLinkImportController(
            dbSessionCreator=self.dbSessionCreator,
            getPgSequenceGenerator=self.getPgSequenceGenerator,
            liveDbWriteApi=liveDbApi.writeApi
        )
        self._loadedObjects.append(dispLinkImportController)

        # Create the display object Import Controller
        dispImportController = DispImportController(
            dbSessionCreator=self.dbSessionCreator,
            getPgSequenceGenerator=self.getPgSequenceGenerator,
            liveDbImportController=dispLinkImportController,
            dispCompilerQueue=dispCompilerQueue,
            dispLookupCache=dispLookupCache
        )
        self._loadedObjects.append(dispImportController)

        # Initialise the API object that will be shared with other plugins
        self._api = DiagramApi(
            mainController, dispImportController, lookupImportController
        )
        self._loadedObjects.append(self._api)

        yield dispCompilerQueue.start()
        yield gridKeyCompilerQueue.start()

        logger.debug("Started")

    def stop(self):
        """ Stop

        This method is called by the platform to tell the peek app to shutdown and stop
        everything it's doing
        """
        # Shutdown and dereference all objects we constructed when we started
        while self._loadedObjects:
            self._loadedObjects.pop().shutdown()

        self._api = None

        logger.debug("Stopped")

    def unload(self):
        """Unload

        This method is called after stop is called, to unload any last resources
        before the PLUGIN is unlinked from the platform

        """
        logger.debug("Unloaded")

    @property
    def publishedServerApi(self) -> object:
        """ Published Server API
    
        :return  class that implements the API that can be used by other Plugins on this
        platform service.
        """
        return self._api

    ###### Implement PluginServerWorkerEntryHookABC

    @property
    def celeryApp(self) -> Celery:
        from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
        return celeryApp
