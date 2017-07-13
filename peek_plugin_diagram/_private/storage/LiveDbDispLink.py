"""
 * orm.LiveDb.py
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

from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.orm.mapper import reconstructor
from sqlalchemy.sql.schema import Index, Sequence

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_livedb.tuples.LiveDbDisplayValueTuple import LiveDbDisplayValueTuple
from vortex.Tuple import Tuple, addTupleType, JSON_EXCLUDE
from .DeclarativeBase import DeclarativeBase
from .Display import DispBase
from .ModelSet import ModelCoordSet

logger = logging.getLogger(__name__)

LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR = {
    'colorId': LiveDbDisplayValueTuple.DATA_TYPE_COLOR,
    'fillColorId': LiveDbDisplayValueTuple.DATA_TYPE_COLOR,
    'lineColorId': LiveDbDisplayValueTuple.DATA_TYPE_COLOR,
    'fillPercent': LiveDbDisplayValueTuple.DATA_TYPE_NUMBER_VALUE,
    'lineStyleId': LiveDbDisplayValueTuple.DATA_TYPE_LINE_STYLE,
    'lineWidth': LiveDbDisplayValueTuple.DATA_TYPE_LINE_WIDTH,
    'text': LiveDbDisplayValueTuple.DATA_TYPE_STRING_VALUE,
    'groupId': LiveDbDisplayValueTuple.DATA_TYPE_GROUP_PTR,
}


@addTupleType
class LiveDbDispLink(Tuple, DeclarativeBase):
    __tupleTypeShort__ = 'LDL'
    __tablename__ = 'LiveDbDispLink'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id_seq = Sequence('LiveDbDispLink_id_seq',
                      metadata=DeclarativeBase.metadata,
                      schema=DeclarativeBase.metadata.schema)
    id = Column(Integer, id_seq, server_default=id_seq.next_value(),
                primary_key=True, autoincrement=True)

    coordSetId = Column(Integer, ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        doc=JSON_EXCLUDE, nullable=False)
    coordSet = relationship(ModelCoordSet)

    dispId = Column(Integer, ForeignKey('DispBase.id', ondelete='CASCADE'),
                     nullable=False)
    disp = relationship(DispBase)

    # # comment="The attribute of the disp item to update"
    # dispTableName = Column(String, nullable=False)

    # comment="The attribute of the disp item to update"
    dispAttrName = Column(String(20), nullable=False)

    liveDbKey = Column(String(30), nullable=False)

    importKeyHash = Column(String)

    importGroupHash = Column(String)

    importDispHash = Column(String)

    # Store custom props for this link
    props = Column(String(500), doc="p")

    __table_args__ = (
        Index("idx_LiveDbDLink_DispKeyHash",
              importKeyHash, importDispHash, dispAttrName, unique=True),
        Index("idx_LiveDbDLink_importGroupHash", importGroupHash, unique=False),
        Index("idx_LiveDbDLink_coordSetId", coordSetId, unique=False),
        Index("idx_LiveDbDLink_dispId", dispId, unique=False),
        Index("idx_LiveDbDLink_dispId_attr", dispId, dispAttrName, unique=True),
        Index("idx_LiveDbDLink_liveKeyId", liveDbKey, unique=False),

        # Designed for faster querying, it only needs to hit the index
        Index("idx_LiveDbDLink_liveDbUpdate", dispId, liveDbKey,
              unique=False),
    )

    @reconstructor
    def __init__(self, **kwargs):
        Tuple.__init__(self, **kwargs)
        self.props = {}
