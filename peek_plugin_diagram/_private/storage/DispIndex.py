from sqlalchemy import Column, Integer, Index

from peek_abstract_chunked_index.private.tuples.ACIProcessorQueueTupleABC import \
    ACIProcessorQueueTupleABC
from peek_plugin_diagram._private.storage.DeclarativeBase import DeclarativeBase


class DispIndexerQueue(DeclarativeBase,
                       ACIProcessorQueueTupleABC):
    __tablename__ = 'DispCompilerQueue'

    id = Column(Integer, primary_key=True, autoincrement=True)
    dispId = Column(Integer, primary_key=True)

    __table_args__ = (
        Index("idx_DispCompQueue_dispId", dispId, unique=False),
    )

    @classmethod
    def sqlCoreLoad(cls, row):
        return DispIndexerQueue(id=row.id, dispId=row.dispId)

    def ckiUniqueKey(self):
        return self.dispId

    @classmethod
    def tupleType(cls):
        return 'DispCompilerQueue (Not a Tuple)'