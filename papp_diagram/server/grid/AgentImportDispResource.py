""" 
 * view.common.uiobj.Style.py
 *
 *  Copyright Synerty Pty Ltd 2013
 *
 *  This software is proprietary, you are not free to copy
 *  or redistribute this code in any format.
 *
 *  All rights to this software are reserved by 
 *  Synerty Pty Ltd
 *
"""

#
# import json
# import logging
# from base64 import b64decode
# from datetime import datetime
#
# from twisted.internet.threads import deferToThread
# from twisted.web.server import NOT_DONE_YET
#
# from txhttputil.Resources import BasicResource, addResource
#
# logger = logging.getLogger(__name__)
#
# @addResource('/peek_server.agent.import.disp')
# class PeekDispGridKeyResource(BasicResource):
#     isLeaf = True
#     isGzipped = True
#
#     def render_GET(self, request):
#         return self._renderLogin(request)
#
#     def render_POST(self, request):
#         # request.responseHeaders.setRawHeaders("authorization", ["basic"])
#
#         startTime = datetime.utcnow()
#
#         def good(deferArg):
#             # We only respond if there are grid updates
#             request.finish()
#
#         def bad(failure):
#             request.write(json.dumps({'error': str(failure.value.message)}))
#             request.finish()
#             logger.error(failure.value)
#             return failure
#
#
#         d = deferToThread(self._process, request)
#         d.addErrback(bad)
#         d.addCallback(good)
#
#         def closedError(failure):
#             logger.error("closedError : %s" % failure.value)
#
#         def closedOk(data):
#             logger.debug("Disp Grid Update POST Siccess. Total time is %s"
#                          % (datetime.utcnow() - startTime))
#
#         request.notifyFinish().addCallbacks(closedOk, closedError)
#
#         return NOT_DONE_YET
#
#     def _process(self, request):
#         filt = json.loads(b64decode(request.args['encodedFilt'][0]))
#
#         modelSetName = filt['modelSetName']
#         coordSetName = filt.get('coordSetName')
#
#         dispGridRef = filt['dispGridRef']
#
#         logger.debug("Loading disp grid update for %s" % dispGridRef)
#
#         d = AgentImportDispGrid().import_(modelSetName, coordSetName,
#                                           tuples)
#
#         successFilt = {'key': "c.s.p.ai.grid_update_success",
#                        'infoKey': filt['infoKey'],
#                        'date': filt['date'],
#                        'hash': filt['hash']}
#
#         d.addCallback(self._sendSuccess, vortexUuid, successFilt)
#         return d
#
#     def _sendSuccess(self, deferArg, vortexUuid, successFilt):
#         logger.debug("Sending lookup load success for %s", successFilt['infoKey'])
#
#         payload = Payload()
#         payload.filt = successFilt
#         vortexSendPayload(payload, vortexUuid=vortexUuid)
#
