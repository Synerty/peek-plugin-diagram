from typing import List


from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_diagram._private.storage.Lookups import DispColor
from peek_plugin_diagram._private.storage.Lookups import DispLayer
from peek_plugin_diagram._private.storage.Lookups import DispLevel
from peek_plugin_diagram._private.storage.Lookups import DispLineStyle
from peek_plugin_diagram._private.storage.Lookups import DispTextStyle


class WorkerDiagramLookupApiImpl:
    def __init__(self):
        pass

    @classmethod
    def getColors(cls) -> List[DispColor]:
        ormSession = CeleryDbConn.getDbSession()
        try:
            rows = ormSession.query(DispColor).all()

            tuples = []

            for row in rows:
                tuple_ = row.toTuple()
                tuples.append(tuple_)

            return tuples

        finally:
            ormSession.close()

    @classmethod
    def getLineStyles(cls) -> List[DispLineStyle]:
        ormSession = CeleryDbConn.getDbSession()
        try:
            rows = ormSession.query(DispLineStyle).all()

            tuples = []
            for row in rows:
                tuple_ = row.toTuple()
                tuples.append(tuple_)

            return tuples

        finally:
            ormSession.close()

    @classmethod
    def getTextStyles(cls) -> List[DispTextStyle]:
        ormSession = CeleryDbConn.getDbSession()
        try:
            rows = ormSession.query(DispTextStyle).all()

            tuples = []
            for row in rows:
                tuple_ = row.toTuple()
                tuples.append(tuple_)

            return tuples

        finally:
            ormSession.close()

    @classmethod
    def getLayers(cls) -> List[DispLayer]:
        ormSession = CeleryDbConn.getDbSession()
        try:
            rows = ormSession.query(DispLayer).all()

            tuples = []
            for row in rows:
                tuple_ = row.toTuple()
                tuples.append(tuple_)

            return tuples

        finally:
            ormSession.close()

    @classmethod
    def getLevels(cls) -> List[DispLevel]:
        ormSession = CeleryDbConn.getDbSession()
        try:
            rows = ormSession.query(DispLevel).all()

            tuples = []
            for row in rows:
                tuple_ = row.toTuple()
                tuples.append(tuple_)

            return tuples

        finally:
            ormSession.close()
