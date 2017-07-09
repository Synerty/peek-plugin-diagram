import logging
from datetime import datetime

import os
from suds import client as SudsClient
from twisted.internet import task, reactor
from twisted.internet.defer import DeferredSemaphore
from twisted.internet.threads import deferToThread

logger = logging.getLogger(__name__)

logging.getLogger('suds.client').setLevel(logging.INFO)
logging.getLogger('suds.transport').setLevel(logging.INFO)
logging.getLogger('suds.resolver').setLevel(logging.INFO)
logging.getLogger('suds.mx.core').setLevel(logging.INFO)
logging.getLogger('suds.mx.literal').setLevel(logging.INFO)
logging.getLogger('suds.metrics').setLevel(logging.INFO)
logging.getLogger('suds.wsdl').setLevel(logging.INFO)
logging.getLogger('suds.xsd.schema').setLevel(logging.INFO)
logging.getLogger('suds.xsd.query').setLevel(logging.INFO)
logging.getLogger('suds.xsd.sxbasic').setLevel(logging.INFO)
logging.getLogger('suds.xsd.sxbase').setLevel(logging.INFO)
logging.getLogger('suds.umx.typed').setLevel(logging.INFO)


class RealtimeValue:
    def __init__(self, compAlias, attrName, peekKey):
        self.compAlias, self.attrName, self.peekKey = compAlias, attrName, peekKey
        self.value = None
        self.lastUpdateDate = None

    def updateValue(self, value):
        if value == self.value:
            return False
        self.value = value
        self.lastUpdateDate = datetime.utcnow()

        return True

    def toTuple(self):
        return (self.peekKey, self.value)


class RealtimePoller:
    def __init__(self):
        self._realTimeValuesByKey = {}

        # Start our heart beat checker
        self._pollLoopingCallSemophore = DeferredSemaphore(1)
        self._pollLoopingCall = task.LoopingCall(self._pollBlocking)
        self._pollLoopingCall.start(3.0)

    def updateKeys(self, keys):

        # Remove keys we're not monitoring anymore
        keysToRemove = set(self._realTimeValuesByKey) - set(keys)
        for key in keysToRemove:
            del self._realTimeValuesByKey[key]

        # Sort the formats of keys, we could get CompID.attrName, or attrId
        # or attrId[row], or attrId[row][col]
        for key in keys:
            compAlias, attrName = key.split('.')
            self._realTimeValuesByKey[key] = RealtimeValue(compAlias, attrName, key)

        self._poll()

    def _poll(self):
        # The timer doesn't resume until this deferred is called
        return self._pollLoopingCallSemophore.run(deferToThread, self._pollBlocking)

    def _pollBlocking(self):
        if not self._realTimeValuesByKey:
            return

        wsdlDir = os.path.dirname(__file__)

        values = []

        fetchSize = 400
        chunkIndex = 0
        allRtValues = list(self._realTimeValuesByKey.values())

        while chunkIndex < len(allRtValues):
            chunkRtValues = allRtValues[chunkIndex:chunkIndex + fetchSize]
            chunkIndex += fetchSize

            # This parses the wsdl file. The autoblend option you'd probably skip,
            # its needed when name spaces are not strictly preserved (case for Echo Sign).
            sudsClient = SudsClient.Client('file://' + wsdlDir + "/Realtime_inbound.wsdl",
                                           location="http://192.168.35.128:15043/enmac/SOAP/SOAPInBound/Realtime",
                                           autoblend=True)

            parameter = sudsClient.factory.create('FetchScalarValuesStc')

            for rtValue in chunkRtValues:
                addr = sudsClient.factory.create('RtdbAddressStc')
                addr.ComponentAlias = rtValue.compAlias
                addr.AttributeName = rtValue.attrName
                parameter.Address.append(addr)

            response = sudsClient.service.FetchScalarValues(parameter)
            if response.Status != 0:
                logger.error("SOAP ERROR : %s", response.ErrorMsg)
                return

            '''
            00 = {instance} FetchScalarValueResultStc: (FetchScalarValueResultStc){
                Address = (RtdbAddressStc){
                        AttributeName = "State"
                        ComponentAlias = "ALIAS-391336-D"
                    }
                Scalar = (ScalarNullableStc){
                        Quality = 0
                        Timestamp = {Text} 2016-03-25T02:11:50.051540+13:00
                        Value = {Text} 0
                    }
            }
            '''

            for result in response.Result:
                key = '%s.%s' % (
                result.Address.ComponentAlias, result.Address.AttributeName)
                values.append((key, result.Scalar.Value))

        if values:
            reactor.callLater(0, self._pollComplete, values)

    def _pollComplete(self, values):
        updates = []

        for key, value in values:
            value = str(value)
            rtValue = self._realTimeValuesByKey.get(key)
            if not rtValue:
                continue
            if rtValue.updateValue(value):
                updates.append(rtValue.toTuple())

        if updates:
            from peek_agent_pof.realtime.RealtimeHandler import realtimeHandler
            realtimeHandler.sendUpdates(updates)


#realtimePoller = RealtimePoller()
