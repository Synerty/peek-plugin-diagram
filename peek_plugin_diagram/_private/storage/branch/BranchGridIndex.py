from sqlalchemy import Column, Index, ForeignKey
from sqlalchemy import Integer, String
from sqlalchemy.orm import relationship

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram._private.storage.DeclarativeBase import DeclarativeBase
from peek_plugin_diagram._private.storage.branch.BranchType import \
    BranchType
from peek_plugin_diagram._private.storage.ModelSet import ModelSet
from vortex.Tuple import Tuple, addTupleType


@addTupleType
class BranchGridIndex(Tuple, DeclarativeBase):
    """ Branch Grid Index

    This table stores the READ-ONLY version of the branch, this data is structured
    to be included in the Grids and optimised for fast rendering, not editing.

    """
    __tablename__ = 'BranchIndex'
    __tupleType__ = diagramTuplePrefix + 'BranchIndexTable'

    #:  The unique ID of this branchIndex (database generated)
    id = Column(Integer, primary_key=True, autoincrement=True)

    #:  The BranchIndex that this part of the branch belongs to
    branchIndexId = Column(Integer,
                        ForeignKey('BranchIndex.id', ondelete='CASCADE'),
                        nullable=False)
    # branchIndex = relationship(BranchIndex)

    #:  The Grid Key for this subset of a branch fits into.
    gridKey = Column(String, nullable=False)

    #:  The JSON for this grid part of the the branch, ready for the Compiler to use
    packedJson = Column(String, nullable=False)

    __table_args__ = (
        Index("idx_BranchIndex_key", branchIndexId, gridKey, unique=True),
    )
