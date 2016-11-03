# import traceback
#
# from geoalchemy2.shape import to_shape, from_shape
# from shapely.geometry.linestring import LineString
# from shapely.geometry.point import Point
# from sqlalchemy.orm.exc import NoResultFound
#
# from peek_server.core.import_util.ModelSetBaseline import ModelSetBaseline
# from peek_server.core.orm.ModelSet import ModelNode, ModelConn, ModelConnCoord, \
#     ModelConnType, ModelSet, ModelCoordSet, \
#     ModelNodeCoord, ModelNodeType
# from peek_server.ui.diagram.DxfViewerModelHandler import createConnRenderable, \
#     createNodeRenderable, dxfModelDataHandler
# from rapui.payload.Payload import Payload
# from rapui.payload.PayloadFilterKeys import plIdKey
#
# __author__ = 'peek_server'
# '''
# Created on 09/07/2014
#
# @author: synerty
# '''
#
# from rapui.payload.PayloadEndpoint import PayloadEndpoint
# from rapui.vortex.Vortex import vortexSendTuple, vortexSendPayload
# from peek_server.core.orm import getNovaOrmSession
#
# import logging
#
# logger = logging.getLogger(__name__)
#
# dxfModelNodeCreateFiltKey = "c.s.mod.dxf.model.node.create"
# dxfModelNodeCreateFilt = {dxfModelNodeCreateFiltKey: None}
#
# dxfModelCableCreateFiltKey = "c.s.mod.dxf.model.cable.create"
# dxfModelCableCreateFilt = {dxfModelCableCreateFiltKey: None}
#
#
# # Handle command for model extraction
# # ModelSet HANDLER
# class __CreateNodeHandler():
#     def process(self, payload, vortexUuid=None, **kwargs):
#         session = getNovaOrmSession()
#
#         try:
#             oval = payload.tuples[0]
#             nodeName = oval.uiData['name']
#             nodeTypeName = oval.uiData['type']
#             dxfFileId = oval.uiData['dxfId']
#             createOnRendId = oval.uiData['createOnRendId']
#
#             createOnConnCoordId = createOnRendId.split('.')[1] if createOnRendId else None
#
#             point = (oval.left + oval.width / 2, oval.top + oval.height / 2)
#
#             modelSet = (session
#                         .query(ModelSet)
#                         # .filter(ModelSet.name == ExtractAuroraDunedinModel.MODEL_SET_NAME)
#                         .one())
#             coordSet = (session.query(ModelCoordSet)
#                         .filter(ModelCoordSet.importId1 == dxfFileId)
#                         .one())
#             nodeType = (session.query(ModelNodeType)
#                         .filter(ModelNodeType.name == nodeTypeName)
#                         .one())
#
#             def create(nodeName=""):
#                 node = ModelNode()
#                 node.modelSet = modelSet
#                 node.props = {'name': nodeName}
#                 node.importId1 = dxfFileId
#                 node.importId2 = nodeName
#                 node.type = nodeType
#
#                 session.add(node)
#                 return node
#
#             isPageJoin = nodeType.name == ModelSetBaseline.feederDiagramJoin.name
#
#             if isPageJoin:
#                 # Allow lazy creation of page joins, only needing the dst feeder
#                 dxfFile = session.query(DxfFile).filter(DxfFile.id == dxfFileId).one()
#                 if not "-" in nodeName:
#                     nodeName = "1-%s-%s" % (dxfFile.feederName, nodeName)
#
#                 # Ensure the name follows the correct order.
#                 parts = nodeName.split('-')
#                 nodeName = "%s-%s-%s" % tuple([parts[0]] + sorted(parts[1:]))
#
#                 try:
#                     node = (session
#                             .query(ModelNode)
#                             .filter(ModelNode.props['name'].astext == nodeName)
#                             .filter(ModelNode.type == nodeType)
#                             .one())
#
#                 except NoResultFound:
#                     node = create(nodeName)
#                     node.importId1 = None
#                     node.importId2 = None
#
#             else:
#                 node = create()
#
#             coord = ModelNodeCoord()
#             coord.node = node
#             coord.point = from_shape(Point(point))
#             coord.coordSet = coordSet
#             session.add(coord)
#
#             if createOnConnCoordId != None:
#                 self.connectIntoConnCoord(session, createOnConnCoordId, coord)
#
#             session.commit()
#
#             # if isPageJoin:
#             #     updatePageJoinConnectionProp(node)
#             #     session.commit()
#
#             if createOnConnCoordId != None:
#                 dxfModelDataHandler.sendModelUpdate(payloadFilt={plIdKey: dxfFileId})
#             else:
#                 node.uiData = {'rend': createNodeRenderable(coord)}
#                 vortexSendTuple(payload.filt, [node, node.type],
#                                 vortexUuid=vortexUuid)
#
#         except Exception as e:
#             payload = Payload(filt=payload.filt, result=(e.message))
#             vortexSendPayload(payload, vortexUuid=vortexUuid)
#
#             traceback.print_exc()
#
#             try:
#                 session.rollback()
#             except:
#                 pass
#
#     def connectIntoConnCoord(self, session, connCoordId, nodeCoord):
#         connCoord = (session.query(ModelConnCoord)
#                      .filter(ModelConnCoord.id == connCoordId)
#                      .one())
#
#         nodePoint = to_shape(nodeCoord.point)
#
#         linePoints = to_shape(connCoord.points).coords
#         distances = []
#         for index in range(len(linePoints) - 1):
#             testLineString = LineString([linePoints[index], linePoints[index + 1]])
#             distances.append((index, testLineString.distance(nodePoint)))
#
#         distances.sort(key=lambda i: i[1])
#
#         index, distance = distances[0]
#         if distance > 8:
#             raise Exception("Node was created too for from the selected line")
#
#         section1LinePoints = linePoints[:index + 1] + list(nodePoint.coords)
#         section2LinePoints = list(nodePoint.coords) + linePoints[index + 1:]
#         dstNode = connCoord.conn.dst
#
#         # 1) Update the existing conductor
#         connCoord.conn.dst = nodeCoord.node
#         connCoord.points = from_shape(LineString(section1LinePoints))
#
#         # 2) Create the new objects
#         newConn = connCoord.conn.tupleClone()
#         newConn.id = None
#         newConn.srcId = None
#         newConn.src = nodeCoord.node
#         newConn.dstId = None
#         newConn.dst = dstNode
#         session.add(newConn)
#
#         newConnCoord = connCoord.tupleClone()
#         newConnCoord.id = None
#         newConnCoord.points = from_shape(LineString(section2LinePoints))
#         newConnCoord.conn = newConn
#         session.add(newConnCoord)
#
#
# __createNodeHandler = __CreateNodeHandler()
# __endpoint = PayloadEndpoint(dxfModelNodeCreateFilt, __createNodeHandler.process)
#
#
# # Handle command to extract model
# # ModelSet HANDLER
# class __CreateCableHandler():
#     def process(self, payload, vortexUuid=None, **kwargs):
#         session = getNovaOrmSession()
#
#         try:
#             poly = payload.tuples[0]
#             srcNodeId = poly.uiData['startNodeId']
#             dstNodeId = poly.uiData['endNodeId']
#             connTypeName = poly.uiData['type']
#             dxfFileId = poly.uiData['dxfId']
#
#             linePoints = [(poly.left, poly.top)]
#             linePoints += [(p.left + poly.left, p.top + poly.top) for p in poly.points]
#
#             modelSet = (session
#                         .query(ModelSet)
#                         # .filter(ModelSet.name == ExtractAuroraDunedinModel.MODEL_SET_NAME)
#                         .one())
#
#             coordSet = (session.query(ModelCoordSet)
#                         .filter(ModelCoordSet.importId1 == dxfFileId)
#                         .one())
#             connType = (session.query(ModelConnType)
#                         .filter(ModelConnType.name == connTypeName)
#                         .one())
#
#             srcNodeCoord = (session.query(ModelNodeCoord)
#                             .filter(ModelNodeCoord.coordSet == coordSet)
#                             .filter(ModelNodeCoord.nodeId == srcNodeId)
#                             .one())
#
#             dstNodeCoord = (session.query(ModelNodeCoord)
#                             .filter(ModelNodeCoord.coordSet == coordSet)
#                             .filter(ModelNodeCoord.nodeId == dstNodeId)
#                             .one())
#
#             linePoints[0] = to_shape(srcNodeCoord.point).coords[0]
#             linePoints[-1] = to_shape(dstNodeCoord.point).coords[0]
#
#             conn = ModelConn()
#             conn.modelSet = modelSet
#             conn.srcId = srcNodeId
#             conn.dstId = dstNodeId
#             conn.importId1 = dxfFileId
#             conn.type = connType
#
#             session.add(conn)
#
#             coord = ModelConnCoord()
#             coord.conn = conn
#             coord.points = from_shape(LineString(linePoints))
#             coord.coordSet = coordSet
#             session.add(coord)
#
#             session.commit()
#             # session.expire_all()
#             #
#             # if srcNodeCoord.node.type.name == ModelSetBaseline.feederDiagramJoin.name:
#             #     updatePageJoinConnectionProp(srcNodeCoord.node)
#             #
#             # elif dstNodeCoord.node.type.name == ModelSetBaseline.feederDiagramJoin.name:
#             #     updatePageJoinConnectionProp(dstNodeCoord.node)
#             #
#             # session.commit()
#
#
#             conn.uiData = {'rend': createConnRenderable(coord)}
#             vortexSendTuple(payload.filt, [conn, conn.type],
#                             vortexUuid=vortexUuid)
#
#         except Exception as e:
#             payload = Payload(payload.filt, result=(e.message))
#             vortexSendPayload(payload, vortexUuid=vortexUuid)
#
#             print e
#
#             try:
#                 session.rollback()
#             except:
#                 pass
#
#
# __createCableHandler = __CreateCableHandler()
# __endpoint = PayloadEndpoint(dxfModelCableCreateFilt, __createCableHandler.process)
