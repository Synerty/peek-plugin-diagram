from sqlalchemy import Column, Index, ForeignKey
from sqlalchemy import Integer, String
from vortex.Tuple import Tuple, addTupleType

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram._private.storage.DeclarativeBase import DeclarativeBase


@addTupleType
class BranchGridIndex(Tuple, DeclarativeBase):
    """ Branch Grid Index

    This table stores the READ-ONLY version of the branch, this data is structured
    to be included in the Grids and optimised for fast rendering, not editing.

    """
    __tablename__ = 'BranchGridIndex'
    __tupleType__ = diagramTuplePrefix + 'BranchGridIndexTable'

    #:  The unique ID of this branchIndex (database generated)
    id = Column(Integer, primary_key=True, autoincrement=True)

    #:  The BranchIndex that this part of the branch belongs to
    branchIndexId = Column(Integer,
                        ForeignKey('BranchIndex.id', ondelete='CASCADE'),
                        nullable=False)
    # branchIndex = relationship(BranchIndex)

    #:  The Grid Key for this subset of a branch fits into.
    gridKey = Column(String, nullable=False)

    __table_args__ = (
        Index("idx_BranchGridIndex_key", branchIndexId, gridKey, unique=True),
    )
