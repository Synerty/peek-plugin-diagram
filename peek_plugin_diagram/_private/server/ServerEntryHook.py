import logging

from celery import Celery

from peek_plugin_base.server.PluginServerEntryHookABC import PluginServerEntryHookABC
from peek_plugin_base.server.PluginServerStorageEntryHookABC import \
    PluginServerStorageEntryHookABC
from peek_plugin_base.server.PluginServerWorkerEntryHookABC import \
    PluginServerWorkerEntryHookABC
from peek_plugin_diagram._private.server.api.DiagramApi import DiagramApi
from peek_plugin_diagram._private.server.client_handlers.ClientGridUpdateHandler import \
    ClientGridUpdateHandler
from peek_plugin_diagram._private.server.client_handlers.RpcForClient import RpcForClient
from peek_plugin_diagram._private.server.controller.DispCompilerQueueController import \
    DispCompilerQueueController
from peek_plugin_diagram._private.server.controller.DispImportController import \
    DispImportController
from peek_plugin_diagram._private.server.controller.GridKeyCompilerQueueController import \
    GridKeyCompilerQueueController
from peek_plugin_diagram._private.server.controller.LiveDbWatchController import \
    LiveDbWatchController
from peek_plugin_diagram._private.server.controller.LookupImportController import \
    LookupImportController
from peek_plugin_diagram._private.storage import DeclarativeBase
from peek_plugin_diagram._private.storage.DeclarativeBase import loadStorageTuples
from peek_plugin_diagram._private.tuples import loadPrivateTuples
from peek_plugin_diagram.tuples import loadPublicTuples
from peek_plugin_livedb.server.LiveDBApiABC import LiveDBApiABC
from .TupleActionProcessor import makeTupleActionProcessorHandler
from .TupleDataObservable import makeTupleDataObservableHandler
from .admin_handlers import makeAdminBackendHandlers
from .controller.StatusController import StatusController

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

    def start(self):
        """ Start

        This will be called when the plugin is loaded, just after the db is migrated.
        Place any custom initialisation steps here.

        """

        # create the Status Controller
        clientGridUpdateHandler = ClientGridUpdateHandler(self.dbSessionCreator)
        self._loadedObjects.append(clientGridUpdateHandler)

        # create the Status Controller
        statusController = StatusController()
        self._loadedObjects.append(statusController)

        # Create the GRID KEY queue
        gridKeyCompilerQueueController = GridKeyCompilerQueueController(
            self.dbSessionCreator, statusController, clientGridUpdateHandler
        )
        self._loadedObjects.append(gridKeyCompilerQueueController)

        # Create the DISP queue
        dispCompilerQueueController = DispCompilerQueueController(
            self.dbSessionCreator, statusController
        )
        self._loadedObjects.append(dispCompilerQueueController)

        # Create the Action Processor
        self._loadedObjects.append(makeTupleActionProcessorHandler(statusController))

        # Create the Tuple Observer
        tupleObservable = makeTupleDataObservableHandler(
            self.dbSessionCreator, statusController
        )
        self._loadedObjects.append(tupleObservable)

        # Tell the status controller about the Tuple Observable
        statusController.setTupleObservable(tupleObservable)

        # Initialise the handlers for the admin interface
        self._loadedObjects.extend(
            makeAdminBackendHandlers(tupleObservable, self.dbSessionCreator)
        )

        # Create the import lookup controller
        lookupImportController = LookupImportController(
            dbSessionCreator=self.dbSessionCreator
        )
        self._loadedObjects.append(lookupImportController)

        # Create the Live DB Controller
        liveDbApi: LiveDBApiABC = self.platform.getOtherPluginApi("peek_plugin_livedb")

        # Create the Watch Grid Controller
        liveDbWatchController = LiveDbWatchController(
            liveDbWriteApi=liveDbApi.writeApi,
            liveDbReadApi=liveDbApi.readApi,
            dbSessionCreator=self.dbSessionCreator
        )
        self._loadedObjects.append(liveDbWatchController)

        # Create the API for the client
        self._loadedObjects.extend(
            RpcForClient(liveDbWatchController=liveDbWatchController,
                         dbSessionCreator=self.dbSessionCreator)
                .makeHandlers()
        )

        # Create the display object Import Controller
        dispImportController = DispImportController(liveDbWriteApi=liveDbApi.writeApi)
        self._loadedObjects.append(dispImportController)

        # Initialise the API object that will be shared with other plugins
        self._api = DiagramApi(
            statusController, dispImportController, lookupImportController
        )
        self._loadedObjects.append(self._api)

        dispCompilerQueueController.start()
        gridKeyCompilerQueueController.start()

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
