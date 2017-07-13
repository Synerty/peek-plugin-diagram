import logging

from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql.schema import Index, Sequence
from sqlalchemy.sql.sqltypes import DateTime

from peek_plugin_base.storage.TypeDecorators import PeekLargeBinary
from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from vortex.Tuple import Tuple, addTupleType
from .DeclarativeBase import DeclarativeBase
from .Display import DispBase
from .ModelSet import ModelCoordSet

logger = logging.getLogger(__name__)


class DispIndexerQueue(DeclarativeBase):
    __tablename__ = 'DispCompilerQueue'

    id_seq = Sequence('DispCompilerQueue_id_seq',
                      metadata=DeclarativeBase.metadata,
                      schema=DeclarativeBase.metadata.schema)

    id = Column(Integer, id_seq, server_default=id_seq.next_value(),
                primary_key=True, autoincrement=True)
    dispId = Column(Integer, primary_key=True)


@addTupleType
class GridKeyCompilerQueue(Tuple, DeclarativeBase):
    __tablename__ = 'GridKeyCompilerQueue'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id_seq = Sequence('GridKeyCompilerQueue_id_seq',
                      metadata=DeclarativeBase.metadata,
                      schema=DeclarativeBase.metadata.schema)
    id = Column(Integer, id_seq, server_default=id_seq.next_value(),
                primary_key=True, autoincrement=True)

    gridKey = Column(String(30), primary_key=True)
    coordSetId = Column(Integer,
                        ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        primary_key=True)

    __table_args__ = (
        Index("idx_GKCompQueue_coordSetId_gridKey", coordSetId, gridKey, unique=False),
    )


@addTupleType
class GridKeyIndex(Tuple, DeclarativeBase):
    __tablename__ = 'GridKeyIndex'
    __tupleType__ = diagramTuplePrefix + __tablename__

    gridKey = Column(String(30), primary_key=True)
    dispId = Column(Integer,
                    ForeignKey('DispBase.id', ondelete='CASCADE'),
                    primary_key=True)

    disp = relationship(DispBase)

    coordSetId = Column(Integer,
                        ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        nullable=False)
    coordSet = relationship(ModelCoordSet)

    __table_args__ = (
        Index("idx_GridKeyIndex_gridKey", gridKey, unique=False),
        Index("idx_GridKeyIndex_dispId", dispId, unique=False),
        Index("idx_GridKeyIndex_coordSetId", coordSetId, unique=False),
    )


@addTupleType
class GridKeyIndexCompiled(Tuple, DeclarativeBase):
    __tablename__ = 'GridKeyIndexCompiled'
    __tupleType__ = diagramTuplePrefix + __tablename__

    gridKey = Column(String(30), primary_key=True)
    blobData = Column(PeekLargeBinary, nullable=False)
    lastUpdate = Column(DateTime, nullable=False)

    coordSetId = Column(Integer,
                        ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        primary_key=True)
    coordSet = relationship(ModelCoordSet)

    __table_args__ = (
        Index("idx_GKIndexUpdate_gridKey", gridKey, lastUpdate, unique=False),
        Index("idx_GKIndexUpdate_coordSetId", coordSetId, unique=False),
    )
