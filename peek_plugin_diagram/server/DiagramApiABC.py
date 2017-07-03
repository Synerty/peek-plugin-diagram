from abc import ABCMeta, abstractmethod



class DiagramApiABC(metaclass=ABCMeta):

    @abstractmethod
    def doSomethingGood(self, somethingsDescription:str) :
        """ Add a New Task

        Add a new task to the users device.

        :param somethingsDescription: An arbitrary string
        :return: The computed result contained in a DoSomethingTuple tuple

        """
