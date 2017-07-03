from peek_plugin_diagram._private.server.controller.MainController import MainController
from peek_plugin_diagram.server.DiagramApiABC import DiagramApiABC


class DiagramApi(DiagramApiABC):
    def __init__(self, mainController: MainController):
        self._mainController = mainController

    def doSomethingGood(self, somethingsDescription: str)  :
        """ Do Something Good

        Add a new task to the users device.

        :param somethingsDescription: An arbitrary string

        """

        # Here we could pass on the request to the self._mainController if we wanted.
        # EG self._mainController.somethingCalled(somethingsDescription)



    def shutdown(self):
        pass
