""" 
 * orm.Display.py
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
from geoalchemy2.types import Geometry
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer, String, Boolean
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.orm.mapper import reconstructor
from sqlalchemy.sql.schema import Index, Sequence
from sqlalchemy.sql.sqltypes import Float, DateTime

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from vortex.Tuple import Tuple, addTupleType, TupleField, JSON_EXCLUDE
from .DeclarativeBase import DeclarativeBase
from .ModelSet import ModelCoordSet, ModelSet

DISP_SHORT_ATTR_NAME_MAP = {'colorId': 'c',
                            'fillColorId': 'fc',
                            'lineColorId': 'lc',
                            'lineStyleId': 'ls',
                            'lineWidth': 'w',
                            'text': 'te',
                            'groupId': 'gid',
                            }


@addTupleType
class DispLayer(Tuple, DeclarativeBase):
    __tablename__ = 'DispLayer'
    __tupleTypeShort__ = 'DLA'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    order = Column(Integer, nullable=False, server_default='0')
    selectable = Column(Boolean, nullable=False, server_default='false')
    visible = Column(Boolean, nullable=False, server_default='true')

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(ModelSet)

    importHash = Column(String, doc=JSON_EXCLUDE)

    __table_args__ = (
        Index("idx_DispLayer_modelSetId", modelSetId, unique=False),
    )


@addTupleType
class DispLevel(Tuple, DeclarativeBase):
    __tablename__ = 'DispLevel'
    __tupleTypeShort__ = 'DLE'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    order = Column(Integer, nullable=False, server_default='0')
    minZoom = Column(Float)
    maxZoom = Column(Float)

    coordSetId = Column(Integer, ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        nullable=False)
    coordSet = relationship(ModelCoordSet)

    importHash = Column(String, doc=JSON_EXCLUDE)

    __table_args__ = (
        Index("idx_DispLevel_coordSetId", coordSetId, unique=False),
    )


@addTupleType
class DispTextStyle(Tuple, DeclarativeBase):
    __tupleTypeShort__ = 'DTS'
    __tablename__ = 'DispTextStyle'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    fontName = Column(String, nullable=False, server_default="GillSans")
    fontSize = Column(Integer, nullable=False, server_default='9')
    fontStyle = Column(String)
    scalable = Column(Boolean, nullable=False, server_default="true")
    scaleFactor = Column(Integer, nullable=False, server_default="1")

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        doc=JSON_EXCLUDE, nullable=False)
    modelSet = relationship(ModelSet)

    importHash = Column(String, doc=JSON_EXCLUDE)

    __table_args__ = (
        Index("idx_DispTextStyle_modelSetId", modelSetId, unique=False),
        Index("idx_DispTextStyle_importHash", importHash, unique=True),
    )


@addTupleType
class DispLineStyle(Tuple, DeclarativeBase):
    __tupleTypeShort__ = 'DLS'
    __tablename__ = 'DispLineStyle'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    backgroundFillDashSpace = Column(Boolean, nullable=False, server_default='false')
    capStyle = Column(String, nullable=False)
    joinStyle = Column(String, nullable=False)
    dashPattern = Column(JSONB)
    startArrowSize = Column(Integer)
    endArrowSize = Column(Integer)
    winStyle = Column(Integer, nullable=False)

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        doc=JSON_EXCLUDE, nullable=False)
    modelSet = relationship(ModelSet)

    importHash = Column(String, doc=JSON_EXCLUDE)

    __table_args__ = (
        Index("idx_DispLineStyle_modelSetId", modelSetId, unique=False),
        Index("idx_DispLineStyle_importHash", importHash, unique=True),
    )


@addTupleType
class DispColor(Tuple, DeclarativeBase):
    __tupleTypeShort__ = 'DC'
    __tablename__ = 'DispColor'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, doc=JSON_EXCLUDE, nullable=False)
    color = Column(String, server_default='orange')
    altColor = Column(String)
    swapPeriod = Column(Float)

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        doc=JSON_EXCLUDE, nullable=False)
    modelSet = relationship(ModelSet)

    importHash = Column(String, doc=JSON_EXCLUDE)

    __table_args__ = (
        Index("idx_DispColor_modelSetId", modelSetId, unique=False),
        Index("idx_DispColor_importHash", importHash, unique=True),
    )


class DispBase(Tuple, DeclarativeBase):
    __tablename__ = 'DispBase'

    # Types
    # Must align with constants in javascript DispBase class
    GROUP = 10
    GROUP_PTR = 11
    GROUP_PTR_NODE = 12
    ACTION = 30
    TEXT = 40
    POLYGON = 50
    POLYLINE = 51
    POLYLINE_CONN = 52
    ELLIPSE = 60

    id_seq = Sequence('DispBase_id_seq',
                      metadata=DeclarativeBase.metadata,
                      schema=DeclarativeBase.metadata.schema)
    id = Column(Integer, id_seq, server_default=id_seq.next_value(),
                primary_key=True, autoincrement=True)

    type = Column(Integer, doc=JSON_EXCLUDE, nullable=False)

    coordSetId = Column(Integer, ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        doc=JSON_EXCLUDE,
                        nullable=False)
    coordSet = relationship(ModelCoordSet)

    layerId = Column(Integer, ForeignKey('DispLayer.id', ondelete='CASCADE'), doc='la')
    layer = relationship(DispLayer)

    levelId = Column(Integer, ForeignKey('DispLevel.id', ondelete='CASCADE'), doc='le')
    level = relationship(DispLevel)

    dispJson = Column(JSONB, nullable=False, doc=JSON_EXCLUDE)

    importUpdateDate = Column(DateTime, doc=JSON_EXCLUDE)
    importHash = Column(String, doc=JSON_EXCLUDE)
    importGroupHash = Column(String, doc=JSON_EXCLUDE)
    importLiveDbDispLinks = TupleField([])

    liveDbLinks = relationship("LiveDbDispLink")

    __mapper_args__ = {'polymorphic_on': type,
                       'with_polymorphic': '*'}

    __table_args__ = (
        Index("idx_Disp_importGroupHash", importGroupHash, unique=False),
        # Index("idx_Disp_importHash", importHash, unique=True),
        Index("idx_Disp_importUpdateDate", importUpdateDate, unique=False),

        Index("idx_Disp_layerId", layerId, unique=False),
        Index("idx_Disp_levelId", levelId, unique=False),
        Index("idx_Disp_coordSetId_", coordSetId, unique=False),
    )

    @reconstructor
    def __init__(self):
        Tuple.__init__(self)


@addTupleType
class DispText(DispBase):
    __tablename__ = 'DispText'
    __tupleTypeShort__ = 'DT'
    __tupleType__ = diagramTuplePrefix + __tablename__

    RENDERABLE_TYPE = DispBase.TEXT

    __mapper_args__ = {'polymorphic_identity': RENDERABLE_TYPE}

    id = Column(Integer, ForeignKey('DispBase.id', ondelete='CASCADE')
                , primary_key=True, autoincrement=True)

    verticalAlign = Column(Integer, doc='va', nullable=False, server_default='-1')
    horizontalAlign = Column(Integer, doc='ha', nullable=False, server_default='0')
    rotation = Column(Float, doc='r', nullable=False, server_default='0')
    text = Column(String, doc='te', nullable=False, server_default="new text label")
    textFormat = Column(String, doc=JSON_EXCLUDE, nullable=True)

    geom = Column(Geometry(geometry_type="POINT"), nullable=False, doc='g')

    colorId = Column(Integer, ForeignKey('DispColor.id', ondelete='CASCADE'), doc='c')
    color = relationship(DispColor)

    textStyleId = Column(Integer, ForeignKey('DispTextStyle.id', ondelete='CASCADE'),
                         doc='fs')
    textStyle = relationship(DispTextStyle)

    __table_args__ = (
        Index("idx_DispText_colorId", colorId, unique=False),
        Index("idx_DispText_styleId", textStyleId, unique=False),
    )


@addTupleType
class DispPolygon(DispBase):
    __tablename__ = 'DispPolygon'
    __tupleTypeShort__ = 'DPG'
    __tupleType__ = diagramTuplePrefix + __tablename__

    RENDERABLE_TYPE = DispBase.POLYGON
    __mapper_args__ = {'polymorphic_identity': RENDERABLE_TYPE}

    id = Column(Integer, ForeignKey('DispBase.id', ondelete='CASCADE')
                , primary_key=True, autoincrement=True)

    cornerRadius = Column(Float, doc='cr', nullable=False, server_default='0')
    lineWidth = Column(Integer, doc='w', nullable=False, server_default='2')

    geom = Column(Geometry(geometry_type="POLYGON"), nullable=False, doc='g')

    fillColorId = Column(Integer, ForeignKey('DispColor.id', ondelete='CASCADE'),
                         doc='fc')
    fillColor = relationship(DispColor, foreign_keys=fillColorId)

    FILL_TOP_TO_BOTTOM = 0
    FILL_BOTTOM_TO_TOP = 1
    FILL_RIGHT_TO_LEFT = 2
    FILL_LEFT_TO_RIGHT = 3
    fillDirection = Column(Integer, doc='fd')
    fillPercent = Column(Float, doc='fp')

    lineColorId = Column(Integer, ForeignKey('DispColor.id', ondelete='CASCADE'),
                         doc='lc')
    lineColor = relationship(DispColor, foreign_keys=lineColorId)

    lineStyleId = Column(Integer, ForeignKey('DispLineStyle.id', ondelete='CASCADE'),
                         doc='ls')
    lineStyle = relationship(DispLineStyle)

    __table_args__ = (
        Index("idx_DispPolygon_fillColorId", fillColorId, unique=False),
        Index("idx_DispPolygon_lineColorId", lineColorId, unique=False),
        Index("idx_DispPolygon_lineStyleId", lineStyleId, unique=False),
    )


@addTupleType
class DispPolyline(DispBase):
    __tablename__ = 'DispPolyline'
    __tupleTypeShort__ = 'DPL'
    __tupleType__ = diagramTuplePrefix + __tablename__

    RENDERABLE_TYPE = DispBase.POLYLINE
    __mapper_args__ = {'polymorphic_identity': RENDERABLE_TYPE}

    id = Column(Integer, ForeignKey('DispBase.id', ondelete='CASCADE')
                , primary_key=True, autoincrement=True)

    lineWidth = Column(Integer, doc='w', nullable=False, server_default='2')

    geom = Column(Geometry(geometry_type="LINESTRING"), nullable=False, doc='g')

    lineColorId = Column(Integer, ForeignKey('DispColor.id', ondelete='CASCADE'),
                         doc='lc')
    lineColor = relationship(DispColor, foreign_keys=lineColorId)

    lineStyleId = Column(Integer, ForeignKey('DispLineStyle.id', ondelete='CASCADE'),
                         doc='ls')
    lineStyle = relationship(DispLineStyle)

    __table_args__ = (
        Index("idx_DispPolyline_lineColorId", lineColorId, unique=False),
        Index("idx_DispPolyline_lineStyleId", lineStyleId, unique=False),
    )


@addTupleType
class DispEllipse(DispBase):
    __tablename__ = 'DispEllipse'
    __tupleTypeShort__ = 'DE'
    __tupleType__ = diagramTuplePrefix + __tablename__

    RENDERABLE_TYPE = DispBase.ELLIPSE
    __mapper_args__ = {'polymorphic_identity': RENDERABLE_TYPE}

    id = Column(Integer, ForeignKey('DispBase.id', ondelete='CASCADE')
                , primary_key=True, autoincrement=True)

    xRadius = Column(Float, doc='xr', nullable=False, server_default='10.0')
    yRadius = Column(Float, doc='yr', nullable=False, server_default='10.0')
    rotation = Column(Float, doc='r', nullable=False, server_default='0')
    startAngle = Column(Float, doc='sa', nullable=False, server_default='0')
    endAngle = Column(Float, doc='ea', nullable=False, server_default='360')
    lineWidth = Column(Integer, doc='w', nullable=False, server_default='2')

    geom = Column(Geometry(geometry_type="POINT"), nullable=False, doc='g')

    fillColorId = Column(Integer, ForeignKey('DispColor.id', ondelete='CASCADE'),
                         doc='fc')
    fillColor = relationship(DispColor, foreign_keys=fillColorId)

    lineColorId = Column(Integer, ForeignKey('DispColor.id', ondelete='CASCADE'),
                         doc='lc')
    lineColor = relationship(DispColor, foreign_keys=lineColorId)

    lineStyleId = Column(Integer, ForeignKey('DispLineStyle.id', ondelete='CASCADE'),
                         doc='ls')
    lineStyle = relationship(DispLineStyle)

    __table_args__ = (
        Index("idx_DispEllipse_fillColorId", fillColorId, unique=False),
        Index("idx_DispEllipse_lineColorId", lineColorId, unique=False),
        Index("idx_DispEllipse_lineStyleId", lineStyleId, unique=False),
    )


@addTupleType
class DispAction(DispPolygon):
    __tablename__ = 'DispAction'
    __tupleTypeShort__ = 'DA'
    __tupleType__ = diagramTuplePrefix + __tablename__

    RENDERABLE_TYPE = DispBase.ACTION
    __mapper_args__ = {'polymorphic_identity': RENDERABLE_TYPE}

    id = Column(Integer, ForeignKey('DispPolygon.id', ondelete='CASCADE')
                , primary_key=True, autoincrement=True)

    data = Column(JSONB, doc='d')


@addTupleType
class DispGroupItem(Tuple, DeclarativeBase):
    __tablename__ = 'DispGroupItem'  # Must differ from class name
    __tupleTypeShort__ = 'DGI'
    __tupleType__ = diagramTuplePrefix + __tablename__

    groupId = Column(Integer, ForeignKey('DispGroup.id', ondelete='CASCADE'),
                     primary_key=True, nullable=False)
    itemId = Column(Integer, ForeignKey('DispBase.id', ondelete='CASCADE'),
                    primary_key=True, nullable=False)


@addTupleType
class DispGroup(DispBase):
    __tablename__ = 'DispGroup'
    __tupleTypeShort__ = 'DG'
    __tupleType__ = diagramTuplePrefix + __tablename__

    RENDERABLE_TYPE = DispBase.GROUP
    __mapper_args__ = {'polymorphic_identity': RENDERABLE_TYPE}

    id = Column(Integer, ForeignKey('DispBase.id', ondelete='CASCADE')
                , primary_key=True, autoincrement=True)

    name = Column(String, doc=JSON_EXCLUDE, nullable=False, unique=True)

    items = relationship(DispBase, secondary=DispGroupItem.__table__)

    itemsUi = TupleField(defaultValue={})

    @reconstructor
    def __init__(self):
        DispBase.__init__(self)


@addTupleType
class DispGroupPointer(DispBase):
    __tablename__ = 'DispGroupPointer'
    __tupleTypeShort__ = 'DGP'
    __tupleType__ = diagramTuplePrefix + __tablename__

    RENDERABLE_TYPE = DispBase.GROUP_PTR
    __mapper_args__ = {'polymorphic_identity': RENDERABLE_TYPE}

    id = Column(Integer, ForeignKey('DispBase.id', ondelete='CASCADE')
                , primary_key=True, autoincrement=True)

    rotation = Column(Integer, doc='r', server_default='0', nullable=False)

    verticalScale = Column(Float, doc='vs', nullable=False, server_default='1.0')
    horizontalScale = Column(Float, doc='hs', nullable=False, server_default='1.0')

    geom = Column(Geometry(geometry_type="POINT"), nullable=False, doc='g')

    groupId = Column(Integer, ForeignKey('DispGroup.id', ondelete='CASCADE'),
                     doc='gid', nullable=False)
    group = relationship(DispGroup, foreign_keys=[groupId])

    __table_args__ = (
        Index("idxDispGroupPointer_groupId", groupId, unique=False),
    )


@addTupleType
class DispGroupPointerNode(DispGroupPointer):
    ''' Node Coordinates
    '''
    __tablename__ = 'DispGroupPointerNode'
    __tupleTypeShort__ = 'DGPN'
    __tupleType__ = diagramTuplePrefix + __tablename__

    RENDERABLE_TYPE = DispBase.GROUP_PTR_NODE
    __mapper_args__ = {'polymorphic_identity': RENDERABLE_TYPE}

    id = Column(Integer, ForeignKey('DispGroupPointer.id', ondelete='CASCADE')
                , primary_key=True, autoincrement=True)

    nodeId = Column(Integer, ForeignKey('ModelNode.id', ondelete='CASCADE'),
                    nullable=False)
    node = relationship('ModelNode')

    __table_args__ = (
        Index("idxNodeCoordNodeId", nodeId, unique=False),
    )


@addTupleType
class DispPolylineConn(DispPolyline):
    ''' Node Coordinates
    '''
    __tablename__ = 'DispPolylineConn'
    __tupleTypeShort__ = 'DPLC'
    __tupleType__ = diagramTuplePrefix + __tablename__

    RENDERABLE_TYPE = DispBase.POLYLINE_CONN
    __mapper_args__ = {'polymorphic_identity': RENDERABLE_TYPE}

    id = Column(Integer, ForeignKey('DispPolyline.id', ondelete='CASCADE')
                , primary_key=True, autoincrement=True)

    connId = Column(Integer, ForeignKey('ModelConn.id', ondelete='CASCADE'),
                    nullable=False)
    conn = relationship('ModelConn')

    data = Column(JSONB, doc='d')

    __table_args__ = (
        Index("idxConnCoordConnId", connId, unique=False),
    )
