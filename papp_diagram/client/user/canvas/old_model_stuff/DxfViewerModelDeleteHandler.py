import traceback

from peek.core.import_util.ModelSetBaseline import ModelSetBaseline
from peek.core.orm.ModelSet import ModelNode, ModelNodeCoord, ModelNodeType

from txhttputil import Payload
from txhttputil import PayloadEndpoint

__author__ = 'peek_server'
'''
Created on 09/07/2014

@author: synerty
'''

from txhttputil import vortexSendPayload
from peek.core.orm import getNovaOrmSession

import logging

logger = logging.getLogger(__name__)

dxfModelDeleteFiltKey = "c.s.mod.dxf.model.delete"
dxfModelDeleteFilt = {dxfModelDeleteFiltKey: None}


# Handle command to extract model
# ModelSet HANDLER
class __DeleteHandler():
    def process(self, payload, vortexUuid=None, **kwargs):
        try:
            session = getNovaOrmSession()
            self._process(session, payload)

            payload = Payload(payload.filt, result=True)
            vortexSendPayload(payload, vortexUuid=vortexUuid)

        except Exception as e:
            payload = Payload(payload.filt, result=(e.message))
            vortexSendPayload(payload, vortexUuid=vortexUuid)

            traceback.print_exc()

            try:
                session.rollback()
            except:
                pass

    def _process(self, session, payload):
        tuple = payload.tuples[0]
        Tuple = tuple.__class__

        feederJoinType = (session.query(ModelNodeType)
                          .filter(ModelNodeType.name
                                  == ModelSetBaseline.feederDiagramJoin.name)
                          .all())

        if feederJoinType and tuple.typeId == feederJoinType[0].id:
            node = tuple

            # The format is : rend.id = 'nodeCoord.%s' % nodeCoord.id
            nodeCoordId = int(payload.filt['rendId'].split('.')[1])

            # Delete the nodeCoord
            nodeCoord = (session.query(ModelNodeCoord)
                         .filter(ModelNodeCoord.id == nodeCoordId).one())

            session.delete(nodeCoord)
            session.commit()

            # Delete the node if there are no node coords left
            if not (session.query(ModelNodeCoord)
                            .filter(ModelNodeCoord.nodeId == node.id).count()):
                session.query(ModelNode).filter(ModelNode.id == node.id).delete()

            # else:
            #     updatePageJoinConnectionProp(node)

        else:
            session.query(Tuple).filter(Tuple.id == tuple.id).delete(
                synchronize_session='fetch')
            session.expire_all()
            session.commit()

            # if tuple.isSameTupleType(ModelConn):
            #     for node in (session.query(ModelNode)
            #                          .filter(ModelNode.id.in_([tuple.srcId, tuple.dstId]))):
            #         if node.type.name == ModelSetBaseline.feederDiagramJoin.name:
            #             updatePageJoinConnectionProp(node)

        session.commit()
        session.close()


__deleteHandler = __DeleteHandler()
__endpoint = PayloadEndpoint(dxfModelDeleteFilt, __deleteHandler.process)
