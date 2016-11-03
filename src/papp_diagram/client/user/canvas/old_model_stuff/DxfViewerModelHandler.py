# import traceback
#
# from sqlalchemy.storage.exc import NoResultFound
#
# from peek_server.core.import_util.ModelSetBaseline import ModelSetBaseline
# from peek_server.core.model.ModelUtil import updatePageJoinConnectionProp
# from peek_server.core.storage.ModelSet import ModelConnCoord, \
#     ModelCoordSet, \
#     ModelNodeCoord, ModelNodeType
# from peek_server.ui.diagram.ModelNodeToRenderable import createNodeRenderable, \
#     createConnRenderable
# from rapui.handler.ModelHandler import ModelHandler
# from rapui.payload.Payload import Payload
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
# from peek_server.core.storage import getNovaOrmSession
#
# import logging
#
# logger = logging.getLogger(__name__)
#
# dxfModelExtractFiltKey = "c.s.mod.dxf.model.extract_command"
# dxfModelExtractFilt = {dxfModelExtractFiltKey: None}
#
# dxfModelApplyRulesFiltKey = "c.s.mod.dxf.model.apply_rules_command"
# dxfModelApplyRulesFilt = {dxfModelApplyRulesFiltKey: None}
#
# dxfModelDataFiltKey = "c.s.mod.dxf.model.data"
# dxfModelDataFilt = {dxfModelDataFiltKey: None}
#
#
# # Handle command to extract model
# # ModelSet HANDLER
# class __ExtractModelHandler():
#     def process(self, payload, vortexUuid=None, **kwargs):
#         logging.debug("Extracting model for payload filt %s" % payload.filt)
#
#         dxfFileId = payload.filt.get('id')
#         if dxfFileId == None:
#             raise Exception("dxfFileId is null, select a file first")
#
#         session = getNovaOrmSession()
#         dxfFile = session.query(DxfFile).filter(DxfFile.id == dxfFileId).one()
#
#         try:
#             if dxfFile.region.standard == DxfStandard.DUNEDIN:
#                 ExtractAuroraDunedinModel(dxfFile).run()
#
#             elif dxfFile.region.standard == DxfStandard.CENTRAL:
#                 ExtractAuroraCentralModel(dxfFile).run()
#
#             else:
#                 raise Exception("Unknown DXF Standard")
#
#         except Exception as e:
#             payload = Payload(filt=payload.filt, result=e.message)
#             vortexSendPayload(payload, vortexUuid=vortexUuid)
#
#             traceback.print_exc()
#
#             try:
#                 session.rollback()
#             except:
#                 pass
#
#             return
#
#         dxfModelDataHandler.sendModelUpdate(payloadFilt=payload.filt,
#                                             vortexUuid=vortexUuid)
#
#         vortexSendTuple(payload.filt, [], vortexUuid=vortexUuid)
#
#
# __extractModelHandler = __ExtractModelHandler()
# __extractModelEndpoint = PayloadEndpoint(dxfModelExtractFilt,
#                                          __extractModelHandler.process)
#
#
# # Handle command to extract model
# # ModelSet HANDLER
# class __ApplyRulesModelHandler():
#     def process(self, payload, vortexUuid=None, **kwargs):
#         logging.debug("Applying model rules for payload filt %s" % payload.filt)
#
#         dxfFileId = payload.filt.get('id')
#         if dxfFileId == None:
#             raise Exception("dxfFileId is null, select a file first")
#
#         session = getNovaOrmSession()
#         coordSet = (session.query(ModelCoordSet)
#                     .filter(ModelCoordSet.importId1 == dxfFileId)
#                     .one())
#
#         try:
#             AugRules(coordSet).run()
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
#             return
#
#         dxfModelDataHandler.sendModelUpdate(payloadFilt=payload.filt,
#                                             vortexUuid=vortexUuid)
#
#         vortexSendTuple(payload.filt, [], vortexUuid=vortexUuid)
#
#
# __applyRulesModelHandler = __ApplyRulesModelHandler()
# __applyRulesModelEndpoint = PayloadEndpoint(dxfModelApplyRulesFilt,
#                                             __applyRulesModelHandler.process)
#
#
# # ModelSet HANDLER
# class __Handler(ModelHandler):
#     def buildModel(self, payloadFilt, vortexUuid, session):
#         vortexUuid = None
#
#         tuples = []
#         nodeTypes = set()
#         connTypes = set()
#
#         dxfFileId = payloadFilt.get('id')
#
#         if dxfFileId == None:
#             vortexSendTuple(payloadFilt, [], vortexUuid=vortexUuid)
#             logger.debug("Sent Empty ModelSet, dxfFileId was None")
#             return
#
#         session = getNovaOrmSession()
#
#         try:
#             coordSet = (session.query(ModelCoordSet)
#                         .filter(ModelCoordSet.importId1 == dxfFileId)
#                         .one())
#         except NoResultFound:
#             raise Exception("Model has not been extracted for this DXF yet.")
#
#         logger.debug("Querying ModelSet Nodes")
#         nodeCoords = (session.query(ModelNodeCoord)
#                       .filter(ModelNodeCoord.coordSetId == coordSet.id)
#                       .all())
#
#         feederJoinType = (session.query(ModelNodeType)
#                           .filter(ModelNodeType.name
#                                   == ModelSetBaseline.feederDiagramJoin.name)
#                           .one())
#
#         logger.debug("Querying ModelSet Connectors")
#         for coord in nodeCoords:
#             if coord.node.typeId == feederJoinType.id:
#                 updatePageJoinConnectionProp(coord.node)
#
#             nodeTypes.add(coord.node.type)
#             coord.node.uiData = {'rend': createNodeRenderable(coord)}
#             tuples.append(coord.node)
#
#         session.commit()
#
#         connCoords = (session.query(ModelConnCoord)
#                       .filter(ModelConnCoord.coordSetId == coordSet.id)
#                       .all())
#
#         for coord in connCoords:
#             connTypes.add(coord.conn.type)
#             coord.conn.uiData = {'rend': createConnRenderable(coord)}
#             tuples.append(coord.conn)
#
#         tuples.extend(nodeTypes)
#         tuples.extend(connTypes)
#
#         logger.debug("Finished preparing ModelSet")
#
#         logger.debug("Sending ModelSet")
#         return tuples
#
#
# dxfModelDataHandler = __Handler(dxfModelDataFilt)
