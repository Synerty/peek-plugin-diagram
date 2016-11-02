""" 
 * orm.AgentData.py
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
from sqlalchemy import Integer, String
from sqlalchemy.sql.schema import Index
from sqlalchemy.sql.sqltypes import DateTime

from Base import Base, BaseMixin
from rapui.vortex.Tuple import Tuple, addTupleType, TupleField

logger = logging.getLogger(__name__)


@addTupleType
class AgentImportDispGridInfo(Tuple, Base, BaseMixin):
    """ Agent Import Disp Grid Info

    This table stores information used by the agent about when things need updating.
    There is no relation to the server objects, the agent can use this how ever it wants.

    The server never manipulates this table it's self.

    """
    __tupleType__ = 'c.s.p.ai.grid_info'
    __tablename__ = 'AgentImportDispGridInfo'

    id = Column(Integer, primary_key=True)
    modelSetName = Column(String)
    coordSetName = Column(String)
    # Arbitrary agent reference to it's grid/page/whatever
    dispGridRef = Column(String, nullable=False)

    lastImportDate = Column(DateTime, nullable=True)
    lastImportHash = Column(String, nullable=True)

    updateInProgressDate = TupleField()

    __table_args__ = (
        Index("idx_AImpDispGridInfo_coordSet_key", coordSetName, dispGridRef, unique=True),
    )


"""
@addTupleType
class AgentDispConnSegments(Tuple, Base, BaseMixin):
    __tupleType__ = 'c.s.p.da.conns'
    __tablename__ = 'DispConnSegments'

    id = Column(Integer, primary_key=True)
    connId = Column(String, nullable=False)
    connSegment = Column(Integer, nullable=False)

    pageId = Column(Integer,
                    ForeignKey('PageImpInfo.id', ondelete='CASCADE'),
                    nullable=False)
    page = relationship(AgentImportGridInfo)

    __table_args__ = (
        Index("idx_DispConnSegments_page", pageId, unique=False),
    )


@addTupleType
class AgentLiveDbHotspotDressing(Tuple, Base, BaseMixin):
    __tupleType__ = 'c.s.p.da.dress.livedb'
    __tablename__ = 'LiveDbHotspotDressing'

    id = Column(Integer, primary_key=True)
    hotspotId = Column(String, nullable=False)
    componentId = Column(Integer, nullable=False)

    pageId = Column(Integer,
                    ForeignKey('PageImpInfo.id', ondelete='CASCADE'),
                    nullable=False)
    page = relationship(AgentImportGridInfo)

    __table_args__ = (
        Index("idx_LiveDbHotspotDressing_page", pageId, unique=False),
    )


"""

@addTupleType
class AgentImportLookupInfo(Tuple, Base, BaseMixin):
    """ Agent Import Lookup Info

    This table stores information used by the agent about when things need updating.
    There is no relation to the server objects, the agent can use this how ever it wants.

    The server never manipulates this table it's self.

    """
    __tupleType__ = 'c.s.p.ai.lookup_info'
    __tablename__ = 'AgentImportLookupInfo'

    id = Column(Integer, primary_key=True)
    lookupTupleName = Column(String, nullable=False)
    coordSetName = Column(String, nullable=True)
    lastImportDate = Column(DateTime, nullable=True)
    lastImportHash = Column(String, nullable=True)

    updateInProgressDate = TupleField()

    __table_args__ = (
        Index("idx_AImpLookupInfo_tupleName_coordSet",
              lookupTupleName, coordSetName, unique=True),
    )


@addTupleType
class AgentUpdateInfo(Tuple, Base, BaseMixin):
    """ Agent Update Info

    This table stores information about the agent versions stored in Peek.

    """
    __tupleType__ = 'c.s.p.agent.update_info'
    __tablename__ = 'AgentUpdateInfo'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    fileName = Column(String, nullable=False)
    version = Column(String, nullable=False)
    creator = Column(String, nullable=True)
    website = Column(String, nullable=True)
    buildNumber = Column(String, nullable=True)
    buildDate = Column(String, nullable=True)

    __table_args__ = (
        Index("idx_AgentUpdateInfo_NameVersion",
              name, version, unique=True),
    )

