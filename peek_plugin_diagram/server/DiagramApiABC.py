from typing import List

from abc import ABCMeta, abstractmethod
from twisted.internet.defer import Deferred


class DiagramApiABC(metaclass=ABCMeta):
    @abstractmethod
    def importDisps(self, modelSetName: str, coordSetName: str, importGroupHash: str,
                    disps: List) -> Deferred:
        """ Import Disps

        Add or replace display items in a model

        :param modelSetName:  The name of the model set to import the disps into
        :param coordSetName:  The name of the cooridinate set to import the disps into
        :param importGroupHash:  The unique hash of the input group to import into
        :param disps: An array of disps to import

        :return: A deferred that fires when the disps are loaded and queued for compile

        """

    @abstractmethod
    def importLookups(self, modelSetName: str, coordSetName: str,
                      lookupTupleType: str, lookupTuples: List) -> Deferred:
        """ Import Lookups

        Add or replace diplay lookups in a model

        :param modelSetName:  The name of the model set to import the lookups into
        :param coordSetName:  The name of the coord set to import the lookups into
        :param lookupTupleType:  The type of lookups being imported
        :param lookupTuples: An array of the lookups

        :return: A deferred that fires when the lookups are imported

        """
