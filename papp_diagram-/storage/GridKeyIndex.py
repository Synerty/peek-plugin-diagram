""" 
 * orm.GridKeyIndex.py
 *
 *  Copyright Synerty Pty Ltd 2011
 *
 *  This software is proprietary, you are not free to copy
 *  or redistribute this code in any format.
 *
 *  All rights to this software are reserved by 
 *  Synerty Pty Ltd
 *
"""
import logging

from peek.core.orm.Base import Base, BaseMixin
from peek.core.orm.Display import DispBase
from peek.core.orm.ModelSet import ModelCoordSet
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer, String
from sqlalchemy.dialects.postgresql.base import BYTEA
from sqlalchemy.orm import relationship
from sqlalchemy.sql.schema import Index
from sqlalchemy.sql.sqltypes import DateTime

from txhttputil import Tuple, addTupleType

logger = logging.getLogger(__name__)


@addTupleType
class GridKeyIndex(Tuple, Base, BaseMixin):
    __tupleType__ = 'c.s.p.disp.grid.index'
    __tablename__ = 'GridKeyIndex'

    gridKey = Column(String, primary_key=True)
    dispId = Column(Integer,
                    ForeignKey('DispBase.id', ondelete='CASCADE'),
                    primary_key=True)

    disp = relationship(DispBase)

    coordSetId = Column(Integer,
                        ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        nullable=False)
    coordSet = relationship(ModelCoordSet)

    importGroupHash = Column(String)

    __table_args__ = (
        Index("idx_GridKeyIndex_gridKey", gridKey, unique=False),
        Index("idx_GridKeyIndex_dispId", dispId, unique=False),
        Index("idx_GridKeyIndex_coordSetId", coordSetId, unique=False),
        Index("idx_GridKeyIndex_importGroupHash", importGroupHash, unique=False),
    )


class DispIndexerQueue(Base, BaseMixin):
    __tablename__ = 'DispIndexerQueue'

    id = Column(Integer, primary_key=True, nullable=False)
    dispId = Column(Integer, primary_key=True)


@addTupleType
class GridKeyIndexCompiled(Tuple, Base, BaseMixin):
    __tupleType__ = 'c.s.p.disp.grid.index.update'
    __tablename__ = 'GridKeyIndexCompiled'

    gridKey = Column(String, primary_key=True)
    blobData = Column(BYTEA, nullable=False)
    lastUpdate = Column(DateTime, nullable=False)

    coordSetId = Column(Integer,
                        ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        primary_key=True)
    coordSet = relationship(ModelCoordSet)

    __table_args__ = (
        Index("idx_GKIndexUpdate_gridKey", gridKey, lastUpdate, unique=False),
        Index("idx_GKIndexUpdate_coordSetId", coordSetId, unique=False),
    )


@addTupleType
class GridKeyCompilerQueue(Tuple, Base, BaseMixin):
    __tupleType__ = 'c.s.p.disp.grid.index.compiler.queue'
    __tablename__ = 'GridKeyCompilerQueueController'

    id = Column(Integer, primary_key=True, nullable=False)

    gridKey = Column(String, primary_key=True)
    coordSetId = Column(Integer,
                        ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        primary_key=True)

    __table_args__ = (
        Index("idx_GKCompQueue_coordSetId_gridKey", coordSetId, gridKey, unique=False),
    )
