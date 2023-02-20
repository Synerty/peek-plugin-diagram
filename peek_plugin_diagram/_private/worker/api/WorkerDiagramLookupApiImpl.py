from typing import List

from hashids import Hashids

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.Display import DispColor
from peek_plugin_diagram._private.storage.Display import DispLayer
from peek_plugin_diagram._private.storage.Display import DispLevel
from peek_plugin_diagram._private.storage.Display import DispLineStyle
from peek_plugin_diagram._private.storage.Display import DispTextStyle


class _Hasher:
    def __init__(self):
        self._hashids = Hashids(salt="7013b24ca9ff46188a1fbbb1fd0129e1")

    @property
    def encode(self):
        return self._hashids.encode

    @property
    def decode(self):
        return self._hashids.decode


class WorkerDiagramLookupApiImpl:
    def __init__(self):
        self._hasher = _Hasher()

    @classmethod
    def getColors(cls) -> List[DispColor]:
        ormSession = CeleryDbConn.getDbSession()
        try:
            hasher = _Hasher()

            rows = ormSession.query(DispColor).all()

            tuples = []

            for row in rows:
                tuple_ = row.toTuple(hasher.encode)
                tuples.append(tuple_)

            return tuples

        finally:
            ormSession.close()

    @classmethod
    def getLineStyles(cls) -> List[DispLineStyle]:
        ormSession = CeleryDbConn.getDbSession()
        try:
            hasher = _Hasher()

            rows = ormSession.query(DispLineStyle).all()

            tuples = []
            for row in rows:
                tuple_ = row.toTuple(hasher.encode)
                tuples.append(tuple_)

            return tuples

        finally:
            ormSession.close()

    @classmethod
    def getTextStyles(cls) -> List[DispTextStyle]:
        ormSession = CeleryDbConn.getDbSession()
        try:
            hasher = _Hasher()

            rows = ormSession.query(DispTextStyle).all()

            tuples = []
            for row in rows:
                tuple_ = row.toTuple(hasher.encode)
                tuples.append(tuple_)

            return tuples

        finally:
            ormSession.close()

    @classmethod
    def getLayers(cls) -> List[DispLayer]:
        ormSession = CeleryDbConn.getDbSession()
        try:
            hasher = _Hasher()

            rows = ormSession.query(DispLayer).all()

            tuples = []
            for row in rows:
                tuple_ = row.toTuple(hasher.encode)
                tuples.append(tuple_)

            return tuples

        finally:
            ormSession.close()

    @classmethod
    def getLevels(cls) -> List[DispLevel]:
        ormSession = CeleryDbConn.getDbSession()
        try:
            hasher = _Hasher()

            rows = ormSession.query(DispLevel).all()

            tuples = []
            for row in rows:
                tuple_ = row.toTuple(hasher.encode)
                tuples.append(tuple_)

            return tuples

        finally:
            ormSession.close()
