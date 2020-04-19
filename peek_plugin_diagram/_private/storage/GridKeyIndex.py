import logging

from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql.schema import Index
from vortex.Tuple import Tuple, addTupleType

from peek_plugin_base.storage.TypeDecorators import PeekLargeBinary
from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from .DeclarativeBase import DeclarativeBase
from .Display import DispBase
from .ModelSet import ModelCoordSet

logger = logging.getLogger(__name__)


@addTupleType
class GridKeyCompilerQueue(Tuple, DeclarativeBase):
    __tablename__ = 'GridKeyCompilerQueue'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)

    gridKey = Column(String(30), primary_key=True)
    coordSetId = Column(Integer,
                        ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        primary_key=True)

    __table_args__ = (
        Index("idx_GKCompQueue_coordSetId_gridKey", coordSetId, gridKey, unique=False),
    )


@addTupleType
class GridKeyCompilerQueueTuple(Tuple):
    """ Grid Key Compiler Queue Tuple

    This Tuple is designed to be as fast as possible to serialise and access
    as it's used heavily.

    """
    __tablename__ = 'GridKeyCompilerQueueTuple'
    __tupleType__ = diagramTuplePrefix + __tablename__

    __slots__ = ("data",)
    __rawJonableFields__ = ("data",)

    def __init__(self, id: int = None, coordSetId: int = None, gridKey: str = None):
        Tuple.__init__(self, data=(id, coordSetId, gridKey))

    @property
    def id(self) -> int:
        return self.data[0]

    @property
    def coordSetId(self) -> int:
        return self.data[1]

    @property
    def gridKey(self) -> str:
        return self.data[2]

    @property
    def uniqueId(self):
        return self.gridKey


@addTupleType
class GridKeyIndex(Tuple, DeclarativeBase):
    __tablename__ = 'GridKeyIndex'
    __tupleType__ = diagramTuplePrefix + __tablename__

    gridKey = Column(String(30), primary_key=True)
    dispId = Column(Integer,
                    ForeignKey('DispBase.id', ondelete='CASCADE'),
                    primary_key=True)

    disp = relationship(DispBase)

    coordSetId = Column(Integer, ForeignKey('ModelCoordSet.id', ondelete="CASCADE"),
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

    id = Column(Integer, primary_key=True, autoincrement=True)

    gridKey = Column(String(30), nullable=False)
    encodedGridTuple = Column(PeekLargeBinary, nullable=False)
    lastUpdate = Column(String(50), nullable=False)

    coordSetId = Column(Integer,
                        ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        nullable=False)
    coordSet = relationship(ModelCoordSet)

    __table_args__ = (
        Index("idx_GKIndexUpdate_coordSetId", coordSetId, unique=False),
        Index("idx_GKIndexUpdate_gridKey", gridKey, unique=True),
    )
