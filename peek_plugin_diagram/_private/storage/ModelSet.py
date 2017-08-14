"""
 * orm.ModelSet.py
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
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql.schema import Index
from sqlalchemy.sql.sqltypes import Boolean
from sqlalchemy.types import Float

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from vortex.Tuple import addTupleType, Tuple, TupleField
from .DeclarativeBase import DeclarativeBase


@addTupleType
class ModelSet(Tuple, DeclarativeBase):
    __tablename__ = 'ModelSet'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    comment = Column(String)

    coordSets = relationship('ModelCoordSet')
    nodeTypes = relationship('ModelNodeType')
    connTypes = relationship('ModelConnType')

    uiData = TupleField()

    __table_args__ = (
        Index("idx_ModelSet_name", name, unique=True),
    )


@addTupleType
class ModelCoordSet(Tuple, DeclarativeBase):
    ''' Coordinate Sets
    '''
    __tablename__ = 'ModelCoordSet'
    __tupleType__ = diagramTuplePrefix + __tablename__

    # Ensure gridSizes is serialised when it's sent to the client
    __fieldNames__ = ["gridSizes"]

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    initialPanX = Column(Float, nullable=False, server_default="0")
    initialPanY = Column(Float, nullable=False, server_default="0")
    initialZoom = Column(Float, nullable=False, server_default="0")
    enabled = Column(Boolean, nullable=False, server_default="false")

    comment = Column(String)

    importId1 = Column(Integer)
    importId2 = Column(String(100))

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(ModelSet)

    # Grid size settings
    gridSizes = relationship('ModelCoordSetGridSize',
                             lazy="subquery",
                             order_by="ModelCoordSetGridSize.key")

    minZoom = Column(Float, nullable=False, server_default="0.01")
    maxZoom = Column(Float, nullable=False, server_default="10.0")

    # Nodes and connections
    nodeCoords = relationship('DispGroupPointerNode')
    connCoords = relationship('DispPolylineConn')

    __table_args__ = (
        Index("idxCoordSetModelName", modelSetId, name, unique=True),
        Index("idxCoordSetImportId1", importId1, unique=False),
        Index("idxCoordSetImportId2", importId2, unique=False),

        Index("idxCoordModelSetId", modelSetId, unique=False),
    )


@addTupleType
class ModelCoordSetGridSize(Tuple, DeclarativeBase):
    """ Coord Set Grid Size Settings

    To match a Z_GRID the display item must be min <= ON < max
    The equal to is on the min side, not the max side

    """
    __tablename__ = 'ModelCoordSetGridSize'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(Integer, nullable=False)
    min = Column(Float, nullable=False)
    max = Column(Float, nullable=False)
    xGrid = Column(Integer, nullable=False)
    yGrid = Column(Integer, nullable=False)

    smallestTextSize = Column(Float, nullable=False, server_default="6.0")
    smallestShapeSize = Column(Float, nullable=False, server_default="2.0")

    coordSetId = Column(Integer, ForeignKey('ModelCoordSet.id', ondelete='CASCADE'),
                        nullable=False)
    coordSet = relationship(ModelCoordSet)

    __table_args__ = (
        Index("idx_CoordSetGridSize_key", coordSetId, key, unique=True),
    )

    DEFAULT = [
        dict(min=0.0, max=0.04, key=0, xGrid=30000, yGrid=30000,
             smallestShapeSize=50, smallestTextSize=20),
        dict(min=0.04, max=0.1, key=1, xGrid=10000, yGrid=10000,
             smallestShapeSize=50, smallestTextSize=20),
        dict(min=0.1, max=0.5, key=2, xGrid=2000, yGrid=2000,
             smallestShapeSize=50, smallestTextSize=20),
        dict(min=0.5, max=1000.0, key=3, xGrid=1000, yGrid=1000,
             smallestShapeSize=2, smallestTextSize=6),
    ]

    def makeGridKey(self, x, y):
        """ Make Grid Key

            coordSetId = ModelCoordSet.id
            gridSize = GridSize (above)
            x, y = Grid coordinates, top left
        """
        return '%s|%s.%sx%s' % (self.coordSetId, self.key, x, y)


@addTupleType
class ModelNodeType(Tuple, DeclarativeBase):
    ''' Node Types
    '''
    __tablename__ = 'ModelNodeType'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    comment = Column(String)

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(ModelSet)

    __table_args__ = (
        Index("idxNodeTypeModelSetId", modelSetId, unique=False),
    )


@addTupleType
class ModelNode(Tuple, DeclarativeBase):
    ''' Connection Types
    '''
    __tablename__ = 'ModelNode'
    __tupleType__ = diagramTuplePrefix + __tablename__

    uiData = TupleField(defaultValue={})

    id = Column(Integer, primary_key=True, autoincrement=True)
    propsJson = Column(String(500), doc='pr')

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(ModelSet, lazy='subquery')

    importId1 = Column(Integer)
    importId2 = Column(String(100))

    typeId = Column(Integer, ForeignKey('ModelNodeType.id'),
                    nullable=False)
    type = relationship(ModelNodeType, lazy='subquery')

    coords = relationship('DispGroupPointerNode', lazy='subquery')

    connections = relationship('ModelConn', lazy='subquery',
                               primaryjoin="or_(ModelNode.id==ModelConn.srcId, "
                                           "ModelNode.id==ModelConn.dstId)")

    __table_args__ = (
        Index("idxNodeImportId1", importId1, unique=False),
        Index("idxNodeImportId2", importId2, unique=False),

        Index("idxNodeModelSetId", modelSetId, unique=False),
        Index("idxNodeTypeId", typeId, unique=False),
    )


@addTupleType
class ModelConnType(Tuple, DeclarativeBase):
    ''' Connection Types
    '''
    __tablename__ = 'ModelConnType'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    comment = Column(String)

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(ModelSet)

    __table_args__ = (
        Index("idxConnTypeModelSetId", modelSetId, unique=False),
    )


@addTupleType
class ModelConn(Tuple, DeclarativeBase):
    ''' Connection Types
    '''
    __tablename__ = 'ModelConn'
    __tupleType__ = diagramTuplePrefix + __tablename__

    uiData = TupleField(defaultValue={})

    id = Column(Integer, primary_key=True, autoincrement=True)
    propsJson = Column(String(500), doc='pr')

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(ModelSet, lazy='subquery')

    importId1 = Column(Integer)
    importId2 = Column(String(100))

    typeId = Column(Integer, ForeignKey('ModelConnType.id'),
                    nullable=False)
    type = relationship(ModelConnType)

    srcId = Column(Integer, ForeignKey('ModelNode.id'),
                   nullable=False)
    src = relationship(ModelNode, lazy='subquery', foreign_keys=srcId)

    dstId = Column(Integer, ForeignKey('ModelNode.id'),
                   nullable=False)
    dst = relationship(ModelNode, lazy='subquery', foreign_keys=dstId)

    coords = relationship('DispPolylineConn',lazy='subquery')

    __table_args__ = (
        Index("idxConnSrcDst", srcId, dstId, unique=True),
        Index("idxConnImportId1", importId1, unique=False),
        Index("idxConnImportId2", importId2, unique=False),
        Index("idxConnModelSetId", modelSetId, unique=False),

        Index("idxConnModelSetId", modelSetId, unique=False),
        Index("idxConnModelTypeId", typeId, unique=False),
        Index("idxConnModelSrcId", srcId, unique=False),
        Index("idxConnModelDstId", dstId, unique=False),
    )

    def otherConnectedNode(self, node):
        if node == self.dst: return self.src
        if node == self.src: return self.dst
        raise Exception("This connector doesn't connect to that node")

    def replaceNodeConnection(self, oldNode, newNode):
        if self.dst == oldNode:
            self.dst = newNode
            self.dstId = newNode.id
        elif self.src == oldNode:
            self.src = newNode
            self.srcId = newNode.id
        else:
            raise Exception("This connector doesn't connect to that node")

            # oldNode.connections.remove(self)
            # newNode.connections.append(self)


def getOrCreateModelSet(session, modelSetName):
    qry = session.query(ModelSet).filter(ModelSet.name == modelSetName)
    if not qry.count():
        session.add(ModelSet(name=modelSetName))
        session.commit()

    return qry.one()


def getOrCreateCoordSet(session, modelSetName, coordSetName):
    modelSet = getOrCreateModelSet(session, modelSetName)

    qry = (session.query(ModelCoordSet)
           .filter(ModelCoordSet.modelSetId == modelSet.id)
           .filter(ModelCoordSet.name == coordSetName))

    if not qry.count():
        coordSet = ModelCoordSet(
            modelSetId=modelSet.id,
            name=coordSetName)
        session.add(coordSet)

        for gridSize in ModelCoordSetGridSize.DEFAULT:
            newGrid = ModelCoordSetGridSize(**gridSize)
            newGrid.coordSet = coordSet
            session.add(newGrid)

        session.commit()

    return qry.one()
