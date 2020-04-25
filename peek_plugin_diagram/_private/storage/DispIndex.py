from sqlalchemy import Column, Integer, Index
from vortex.Tuple import addTupleType, Tuple

from peek_abstract_chunked_index.private.tuples.ACIProcessorQueueTupleABC import \
    ACIProcessorQueueTupleABC
from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram._private.storage.DeclarativeBase import DeclarativeBase


@addTupleType
class DispIndexerQueue(Tuple, DeclarativeBase,
                       ACIProcessorQueueTupleABC):
    __tablename__ = 'DispCompilerQueue'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)
    dispId = Column(Integer, primary_key=True)

    __table_args__ = (
        Index("idx_DispCompQueue_dispId", dispId, unique=False),
    )

    @classmethod
    def sqlCoreLoad(cls, row):
        # This import is required otherwise the sqlalchemy mapper complains.
        from . import LiveDbDispLink
        LiveDbDispLink.__unused = True
        return DispIndexerQueue(id=row.id, dispId=row.dispId)

    @property
    def ckiUniqueKey(self):
        return self.dispId