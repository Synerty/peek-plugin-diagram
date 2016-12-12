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
from Base import Base, BaseMixin
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer, String
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql.schema import Index
from sqlalchemy.sql.sqltypes import Boolean
from sqlalchemy.types import Float

from txhttputil import addTupleType, Tuple, TupleField


@addTupleType
class ModelSet(Tuple, Base, BaseMixin):
    __tablename__ = 'ModelSet'
    __tupleType__ = 'model.modelset'

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    comment = Column(String)

    coordSets = relationship('ModelCoordSet')
    nodeTypes = relationship('ModelNodeType')
    connTypes = relationship('ModelConnType')

    uiData = TupleField()


@addTupleType
class ModelCoordSet(Tuple, Base, BaseMixin):
    ''' Coordinate Sets
    '''
    __tablename__ = 'ModelCoordSet'
    __tupleType__ = 'model.coordset'

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    initialPanX = Column(Float, nullable=False, server_default="0")
    initialPanY = Column(Float, nullable=False, server_default="0")
    initialZoom = Column(Float, nullable=False, server_default="0")
    enabled = Column(Boolean, nullable=False, server_default="false")

    comment = Column(String)

    importId1 = Column(Integer)
    importId2 = Column(String)

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(ModelSet)

    nodeCoords = relationship('DispGroupPointerNode')
    connCoords = relationship('DispPolylineConn')

    __table_args__ = (
        Index("idxCoordSetModelName", modelSetId, name, unique=True),
        Index("idxCoordSetImportId1", importId1, unique=True),
        Index("idxCoordSetImportId2", importId2, unique=True),

        Index("idxCoordModelSetId", modelSetId, unique=False),
    )


@addTupleType
class ModelNodeType(Tuple, Base, BaseMixin):
    ''' Node Types
    '''
    __tablename__ = 'ModelNodeType'
    __tupleType__ = 'model.nodetype'

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    comment = Column(String)

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(ModelSet)

    __table_args__ = (
        Index("idxNodeTypeModelSetId", modelSetId, unique=False),
    )


@addTupleType
class ModelNode(Tuple, Base, BaseMixin):
    ''' Connection Types
    '''
    __tablename__ = 'ModelNode'
    __tupleType__ = 'model.node'

    uiData = TupleField(defaultValue={})

    id = Column(Integer, primary_key=True, nullable=False)
    props = Column(JSONB)

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(ModelSet, lazy='subquery')

    importId1 = Column(Integer)
    importId2 = Column(String)

    typeId = Column(Integer, ForeignKey('ModelNodeType.id', ondelete='CASCADE'),
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
class ModelConnType(Tuple, Base, BaseMixin):
    ''' Connection Types
    '''
    __tablename__ = 'ModelConnType'
    __tupleType__ = 'model.conntype'

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    comment = Column(String)

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(ModelSet)

    __table_args__ = (
        Index("idxConnTypeModelSetId", modelSetId, unique=False),
    )


@addTupleType
class ModelConn(Tuple, Base, BaseMixin):
    ''' Connection Types
    '''
    __tablename__ = 'ModelConn'
    __tupleType__ = 'model.conn'

    uiData = TupleField(defaultValue={})

    id = Column(Integer, primary_key=True, nullable=False)
    props = Column(JSONB)

    modelSetId = Column(Integer, ForeignKey('ModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(ModelSet, lazy='subquery')

    importId1 = Column(Integer)
    importId2 = Column(String)

    typeId = Column(Integer, ForeignKey('ModelConnType.id', ondelete='CASCADE'),
                    nullable=False)
    type = relationship(ModelConnType)

    srcId = Column(Integer, ForeignKey('ModelNode.id', ondelete='CASCADE'),
                   nullable=False)
    src = relationship(ModelNode, lazy='subquery', foreign_keys=srcId)

    dstId = Column(Integer, ForeignKey('ModelNode.id', ondelete='CASCADE'),
                   nullable=False)
    dst = relationship(ModelNode, lazy='subquery', foreign_keys=dstId)

    coords = relationship('DispPolylineConn', lazy='subquery')

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
        session.add(ModelCoordSet(modelSetId=modelSet.id,
                                  name=coordSetName))
        session.commit()

    return qry.one()
