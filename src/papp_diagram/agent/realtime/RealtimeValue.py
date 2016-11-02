import logging
from datetime import datetime

from peek_agent.orm.LiveDb import LiveDbKey

logger = logging.getLogger(__name__)


class RealtimeValue:
    '''
    {u'dt': 2,
        u'_tt': u'LDK',
        u'id': 1053080,
        u'key': u'F005c2fe2ATTR|0|0|29',
        u'v': None
    }

    '''

    _tt = u'LDK'
    __slots__ = ['dt', 'id', 'key', 'v',
                 'lastUpdateDate']

    def __init__(self, liveDbJson):
        self.dt = liveDbJson['dt']
        self.id_ = liveDbJson['id']
        self.key = liveDbJson['key']
        self.value = liveDbJson['v']

        self.lastUpdateDate = None

    def updateValue(self, value):
        if value == "0" and self.dt == LiveDbKey.COLOR:
            value = None

        # This would be better as props
        if value == self.value:
            return False

        logger.debug("Recieved update for %s, old=%s, new=%s",
                     self.key, self.value, value)
        self.value = value
        self.lastUpdateDate = datetime.utcnow()
        return True

    def toTuple(self):
        return {u'dt': self.dt,
                u'_tt': self._tt,
                u'id': self.id_,
                u'key': self.key,
                u'v': self.value
                }
