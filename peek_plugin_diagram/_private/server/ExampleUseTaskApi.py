import logging
from datetime import datetime

from twisted.internet import reactor
from twisted.internet.defer import inlineCallbacks

from peek_plugin_active_task.server.ActiveTaskApiABC import ActiveTaskApiABC, NewTask
from peek_plugin_diagram._private.server.controller.StatusController import StatusController

logger = logging.getLogger(__name__)


class ExampleUseTaskApi:
    def __init__(self, mainController: StatusController, activeTaskApi: ActiveTaskApiABC):
        self._mainController = mainController
        self._activeTaskApi = activeTaskApi

    def start(self):
        reactor.callLater(1, self.sendTask)
        return self

    @inlineCallbacks
    def sendTask(self):
        # First, create the task
        newTask = NewTask(
            uniqueId=str(datetime.utcnow()),
            userId="N25",  # <----- Set to your user id
            title="A task from diagram plugin",
            description="Diagrams task description",
            routePath="/peek_plugin_diagram",
            autoDelete=NewTask.AUTO_DELETE_ON_SELECT,
            overwriteExisting=True,
            notificationRequiredFlags=NewTask.NOTIFY_BY_DEVICE_SOUND
                                      | NewTask.NOTIFY_BY_EMAIL
        )

        # Now send the task via the active tasks API
        yield self._activeTaskApi.addTask(newTask)

        logger.debug("Task Sent")

    def shutdown(self):
        pass
