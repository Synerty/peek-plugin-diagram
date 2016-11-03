# import traceback
# from geoalchemy2.shape import to_shape, from_shape
# import shapely
# from shapely.geometry.linestring import LineString
# from shapely.geometry.point import Point
# from sqlalchemy.orm.attributes import flag_modified
# from sqlalchemy.orm.exc import NoResultFound
# from rapui.payload.Payload import Payload
# from peek_server.core.import_aurora_dxf.ExtractAuroraDunedinModel import \
#     ExtractAuroraDunedinModel
# from peek_server.core.import_aurora_dxf.ImportAurora import DXF_PAGE_ID
# from peek_server.core.import_util.ModelSetBaseline import ModelSetBaseline
# from peek_server.core.orm.ModelSet import ModelNode, ModelConn, ModelConnCoord, \
#     ModelConnType, ModelSet, ModelCoordSet, \
#     ModelNodeCoord, ModelNodeType
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
# from peek_server.core.orm.Renderable import OvalRenderable, RenderablePoly, \
#     RenderablePolyPoint
#
# import logging
#
# logger = logging.getLogger(__name__)
#
# dxfModelUpdateFiltKey = "c.s.mod.dxf.model.update"
# dxfModelUpdateFilt = {dxfModelUpdateFiltKey: None}
#
#
# # Handle command to extract model
# # ModelSet HANDLER
# class __UpdateHandler():
#     def process(self, payload, vortexUuid=None, **kwargs):
#         funcs = {RenderablePoly.tupleType(): self._updateConnCoord,
#                  OvalRenderable.tupleType(): self._updateNodeCoord,
#                  ModelConn.tupleType(): self._updateConn,
#                  ModelNode.tupleType(): self._updateNode
#                  }
#
#         try:
#             session = getNovaOrmSession()
#
#             for tuple in payload.tuples:
#                 funcs[tuple.tupleType()](tuple, session)
#             session.commit()
#
#             vortexSendPayload(Payload(filt=payload.filt, result=True),
#                               vortexUuid=vortexUuid)
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
#     def _updateNode(self, node, session):
#         ormNode = self._getObjByTuple(node, session)
#
#         nodeType = (session.query(ModelNodeType)
#                     .filter(ModelNodeType.id == node.typeId)
#                     .one())
#
#         if (ormNode.type.name == ModelSetBaseline.feederDiagramJoin.name
#             and node.props['name'] != ormNode.props['name']
#             and len(ormNode.coords) == 1):
#             relinked = self._relinkFeederJoin(ormNode,
#                                               node.props['name'],
#                                               node.uiData['rend'],
#                                               session)
#             if relinked:
#                 return
#
#         ormNode.props = node.props
#         ormNode.typeId = node.typeId
#
#         # If this is a switch, Make sure it has the "closed" attribute
#         if ModelSetBaseline.NODE_TYPES_BY_NAME[nodeType.name].isSwitchable:
#             if not 'closed' in ormNode.props:
#                 ormNode.props['closed'] = True
#                 flag_modified(ormNode, 'props')
#
#         else:
#             if 'closed' in ormNode.props:
#                 del ormNode.props['closed']
#                 flag_modified(ormNode, 'props')
#
#         self._updateNodeCoord(node.uiData['rend'], session)
#
#     def _updateNodeCoord(self, ovalRend, session):
#         coordId = ovalRend.id.split('.')[1]
#         coord = self._getObjById(ModelNodeCoord, coordId, session)
#         coord.point = from_shape(Point(ovalRend.center()))
#
#     def _relinkFeederJoin(self, ormNode, newName, rend, session):
#
#         existingNodes = (session
#                          .query(ModelNode)
#                          .filter(ModelNode.props['name'].astext == newName)
#                          .filter(ModelNode.type == ormNode.type)
#                          .all())
#
#         # We will only merge if there is only one node matching and it has only one coord
#         if len(existingNodes) != 1 or len(existingNodes[0].coords) != 1:
#             return False
#
#         swapToNode = existingNodes[0]
#
#         # Now, to merge, we point our nodeCoord to the existing node,
#         # and move our conductors over
#
#         ormNode.coords[0].node = swapToNode
#         ormNode.coords[0].nodeId = swapToNode.id
#
#         for conn in ormNode.connections:
#             conn.replaceNodeConnection(ormNode, swapToNode)
#
#         session.commit()
#         session.delete(ormNode)
#         session.commit()
#
#
#     def _updateConn(self, conn, session):
#         ormConn = self._getObjByTuple(conn, session)
#         ormConn.props = conn.props
#         ormConn.typeId = conn.typeId
#
#         self._updateConnCoord(conn.uiData['rend'], session)
#
#     def _updateConnCoord(self, polyRend, session):
#         points = [(polyRend.left, polyRend.top)]
#         points.extend([p.absTuple(polyRend) for p in polyRend.uiData['points']])
#
#         coordId = polyRend.id.split('.')[1]
#         coord = self._getObjById(ModelConnCoord, coordId, session)
#         coord.points = from_shape(LineString(points))
#
#     def _getObjByTuple(self, tuple, session):
#         Tuple = tuple.__class__
#         # print Tuple
#         # print tuple.id
#         return session.query(Tuple).filter(Tuple.id == tuple.id).one()
#
#     def _getObjById(self, Tuple, id, session):
#         return session.query(Tuple).filter(Tuple.id == id).one()
#
#
# __updateHandler = __UpdateHandler()
# __updateEndpoint = PayloadEndpoint(dxfModelUpdateFilt, __updateHandler.process)
