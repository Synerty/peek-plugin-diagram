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
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.orm.mapper import reconstructor
from sqlalchemy.sql.schema import Index

from Base import Base, BaseMixin
from Display import DispBase
from ModelSet import ModelCoordSet, ModelSet
from rapui.vortex.Tuple import Tuple, addTupleType, JSON_EXCLUDE

logger = logging.getLogger(__name__)


@addTupleType
class LiveDbKey(Tuple, Base, BaseMixin):
    __tupleType__ = 'c.s.p.live.key'
    __tupleTypeShort__ = 'LDK'
    __tablename__ = 'LiveDbKey'

    NUMBER_VALUE = 0
    STRING_VALUE = 1
    COLOR = 2
    LINE_WIDTH = 3
    LINE_STYLE = 4
    GROUP_PTR = 5

    id = Column(Integer, primary_key=True, nullable=False, doc="id")

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        doc=JSON_EXCLUDE, nullable=False)
    modelSet = relationship(ModelSet)

    # comment="The unique reference of the value we want from the live db"
    liveDbKey = Column(String, nullable=False, doc="key")

    # comment="The last value from the source"
    value = Column(String, doc="v")

    # comment="The PEEK value, converted to PEEK IDs if required (Color for example)"
    convertedValue = Column(String, doc=JSON_EXCLUDE)

    # comment="The type of data this value represents"
    dataType = Column(Integer, doc="dt")

    # Store custom props for this link
    props = Column(JSONB, doc=JSON_EXCLUDE)

    importHash = Column(String, doc=JSON_EXCLUDE)

    __table_args__ = (
        Index("idx_LiveDbDKey_importHash", importHash, unique=False),
        Index("idx_LiveDbDKey_modelSetId", modelSetId, unique=False),
        Index("idx_LiveDbDKey_liveDbKey", liveDbKey, unique=False),
    )

    @reconstructor
    def __init__(self, **kwargs):
        Tuple.__init__(self, **kwargs)
        self.props = {}


LIVE_DB_KEY_DATA_TYPE_BY_DISP_ATTR = {'colorId': LiveDbKey.COLOR,
                                      'fillColorId': LiveDbKey.COLOR,
                                      'lineColorId': LiveDbKey.COLOR,
                                      'fillPercent': LiveDbKey.NUMBER_VALUE,
                                      'lineStyleId': LiveDbKey.LINE_STYLE,
                                      'lineWidth': LiveDbKey.LINE_WIDTH,
                                      'text': LiveDbKey.STRING_VALUE,
                                      'groupId': LiveDbKey.GROUP_PTR,
                                      }


@addTupleType
class LiveDbDispLink(Tuple, Base, BaseMixin):
    __tupleType__ = 'c.s.p.live.disp_link'
    __tupleTypeShort__ = 'LDL'
    __tablename__ = 'LiveDbDispLink'

    id = Column(Integer, primary_key=True, nullable=False, doc=JSON_EXCLUDE)

    coordSetId = Column(Integer, ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        doc=JSON_EXCLUDE, nullable=False)
    coordSet = relationship(ModelCoordSet)

    dispId = Column(Integer, ForeignKey('DispBase.id', ondelete='CASCADE'),
                    doc="di", nullable=False)
    disp = relationship(DispBase)

    # # comment="The attribute of the disp item to update"
    # dispTableName = Column(String, nullable=False, doc=JSON_EXCLUDE)

    # comment="The attribute of the disp item to update"
    dispAttrName = Column(String, nullable=False, doc="da")

    liveDbKeyId = Column(Integer, ForeignKey('LiveDbKey.id', ondelete='CASCADE'),
                         doc=JSON_EXCLUDE, nullable=False)
    liveDbKey = relationship(LiveDbKey)

    importKeyHash = Column(String, doc=JSON_EXCLUDE)

    importGroupHash = Column(String, doc=JSON_EXCLUDE)

    importDispHash = Column(String, doc=JSON_EXCLUDE)

    # Store custom props for this link
    props = Column(JSONB, doc="p")

    __table_args__ = (
        Index("idx_LiveDbDLink_DispKeyHash",
              importKeyHash, importDispHash, dispAttrName, unique=True),
        Index("idx_LiveDbDLink_importGroupHash", importGroupHash, unique=False),
        Index("idx_LiveDbDLink_coordSetId", coordSetId, unique=False),
        Index("idx_LiveDbDLink_dispId", dispId, unique=False),
        Index("idx_LiveDbDLink_dispId_attr", dispId, dispAttrName, unique=True),
        Index("idx_LiveDbDLink_liveKeyId", liveDbKeyId, unique=False),

        # Designed for faster querying, it only needs to hit the index
        Index("idx_LiveDbDLink_liveDbUpdate", dispId, liveDbKeyId,
              unique=False),
    )

    @reconstructor
    def __init__(self):
        Tuple.__init__(self)
        self.props = {}
