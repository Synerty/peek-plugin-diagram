from abc import ABCMeta, abstractmethod

from peek_plugin_diagram.tuples.lookups.ImportDispColorTuple import DoSomethingTuple


class DiagramApiABC(metaclass=ABCMeta):

    @abstractmethod
    def doSomethingGood(self, somethingsDescription:str) -> DoSomethingTuple:
        """ Add a New Task

        Add a new task to the users device.

        :param somethingsDescription: An arbitrary string
        :return: The computed result contained in a DoSomethingTuple tuple

        """
