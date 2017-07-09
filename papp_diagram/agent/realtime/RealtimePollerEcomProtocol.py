import logging

from peek_agent_pof.imp_model.EnmacOrm import getEnmacSession
from twisted.internet.defer import DeferredList
from twisted.internet.protocol import Protocol, connectionDone
from twisted.internet.task import LoopingCall

from txhttputil import printFailure, deferToThreadWrap

logger = logging.getLogger(__name__)


class _CommonRealtimePollerEcomProtocol(Protocol):
    nextProtocolId = 1

    def __init__(self, factory):
        self._bufferedData = ""
        self._factory = factory
        self.id = self.nextProtocolId
        self.nextProtocolId += 1

    def connectionMade(self):
        pass

    def connectionLost(self, reason=connectionDone):
        Protocol.connectionLost(self, reason)

    def _registerKeys(self, keysToRegister):
        data = []
        msg = "%(attrId)s %(dataType)s %(row)s %(col)s\n"

        for attributeIdRowCol in keysToRegister:
            attributeId, row, col, dataType = attributeIdRowCol.split('|')
            data.append(msg % {'attrId': attributeId,
                               'row': row,
                               'col': col,
                               'dataType': dataType})

        data = ''.join(data)
        count = len(keysToRegister)
        size = len(data)

        header = "DYNAMICS\n%d\n%d\n\0" % (count, size)
        self.transport.write(str(header))
        self.transport.write(str(data))

        logger.debug("EWEBCOM, Registered for %s new attributes", count)

        return self._pollNonRtValues(keysToRegister)

    def dataReceived(self, data):
        '''
        Example Message

        DYNUPDATE
        D006c6591ATTR 0 0 0 0 1
        \0

        '''

        # DEBUG CODE
        # ordData = ''
        # for c in data:
        #     ordData += (c if c.isalnum() or c.isspace() or c == '\n' else '\%0d' % ord(c))
        # print ordData
        self._bufferedData += data

        if self._bufferedData[-1] == '\0':
            self._processData(self._bufferedData)
            self._bufferedData = ""

    def _processData(self, data):
        '''
            *F  <attributeID> 0 <row> <column> <valueType> <currentValue>
        '''

        valuesByAttrIdRowCol = {}
        for line in data.splitlines():
            if line in ['\0', 'DYNUPDATE', '\0DYNUPDATE']:
                continue

            # DEBUG CODE
            # ordData = ''
            # for c in line:
            #     ordData += (c
            #                 if c.isalnum() or c.isspace() or c == '\n' else
            #                 '\%0d' % ord(c))
            # print ordData

            attrId, dataType, row, col, valueType, value = line.split(' ', 5)
            value = ''.join([chr(ord(b)) for b in value])
            attrIdRowCol = '|'.join((attrId, row, col, dataType))
            valuesByAttrIdRowCol[attrIdRowCol] = value

        self._processValues(list(valuesByAttrIdRowCol.items()))

    def _pollNonRtValues(self, keys):
        SIZE = 1000
        return DeferredList([self._pollNonRtValuesChunked(keys[i:i + SIZE])
                             for i in range(0, len(keys), SIZE)])

    @deferToThreadWrap
    def _pollNonRtValuesChunked(self, keys):
        assert len(keys) <= 1000  # Maximum for Oracle

        if not keys:
            return

        attrIds = ','.join(["'%s'" % key.split('|')[0] for key in keys])

        sql = ''' SELECT A.ATTRIBUTE_ID
                          || '|' || VD.COLUMN_NUMBER
                          || '|' || VV.VECTOR_ROW_NUM
                          || '|0' AS KEY,
                      VV.VECTOR_VALUE AS VAL
                    FROM COMPONENT_ATTRIBUTES A
                      JOIN VECTOR_DEFINITION VD
                        ON VD.ATTRIBUTE_ID = A.ATTRIBUTE_ID
                      JOIN VECTOR_VALUES VV
                        ON VV.VECTOR_ID = VD.VECTOR_ID
                    WHERE A.ATTRIBUTE_LOCATION = 0
                      AND A.ATTRIBUTE_ID IN (%s)
                      AND A.ATTRIBUTE_TYPE in (1,2)

                    UNION

                    SELECT A.ATTRIBUTE_ID || '|0|0|0' AS KEY,
                      A.ATTRIBUTE_VALUE AS VAL
                    FROM COMPONENT_ATTRIBUTES A
                      LEFT JOIN VECTOR_DEFINITION VD
                        ON VD.ATTRIBUTE_ID = A.ATTRIBUTE_ID
                      LEFT JOIN VECTOR_VALUES VV
                        ON VV.VECTOR_ID = VD.VECTOR_ID
                    WHERE A.ATTRIBUTE_LOCATION = 0
                      AND A.ATTRIBUTE_ID IN (%s)
                      AND A.ATTRIBUTE_TYPE = 0
                      ''' % (attrIds, attrIds)

        enmacSession = getEnmacSession()
        attrIdRowColValueItems = enmacSession.execute(sql).fetchall()
        enmacSession.close()
        self._processValues(attrIdRowColValueItems)

    def _processValues(self, attrIdRowColValueItems):
        updates = []
        for attrIdRowCol, value in attrIdRowColValueItems:
            rtValue = self._factory._realTimeValuesByKey.get(attrIdRowCol)
            if not rtValue:
                continue

            if rtValue.updateValue(value):
                updates.append(rtValue.toTuple())

        if not updates:
            return

        logger.debug("Received %s RT updates", len(updates))

        from peek_agent_pof.realtime.RealtimeHandler import realtimeHandler
        realtimeHandler.sendUpdates(updates)


class RealtimePollerEcomProtocolPoller(_CommonRealtimePollerEcomProtocol):
    POLL_CHUNK = 500
    POLL_PERIOD = 1.0  # ms

    def __init__(self, factory):
        _CommonRealtimePollerEcomProtocol.__init__(self, factory)

        self._nextAttrIndex = 0
        self._pollerLoopingCall = LoopingCall(self._rotatingPoll)

    def connectionMade(self):
        _CommonRealtimePollerEcomProtocol.connectionMade(self)
        d = self._pollerLoopingCall.start(self.POLL_PERIOD)
        d.addErrback(printFailure)

    def connectionLost(self, reason=connectionDone):
        _CommonRealtimePollerEcomProtocol.connectionLost(self, reason)
        self._pollerLoopingCall.stop()

    def _rotatingPoll(self):
        allKeys = self._factory.allKeys

        if self._factory.lastRotateKeyIndex > len(allKeys):
            self._factory.lastRotateKeyIndex = 0

        index = self._factory.lastRotateKeyIndex
        chunk = [rtv.key for rtv in allKeys[index: index + self.POLL_CHUNK]]
        self._factory.lastRotateKeyIndex += self.POLL_CHUNK

        logger.debug("Rotating to index %s", index)
        return self._registerKeys(chunk)


class RealtimePollerEcomProtocolWatcher(_CommonRealtimePollerEcomProtocol):
    def connectionMade(self):
        _CommonRealtimePollerEcomProtocol.connectionMade(self)
        self.registerWatchedAttributes()

    def registerWatchedAttributes(self):
        self._registerKeys(self._factory.keysToRegister)
