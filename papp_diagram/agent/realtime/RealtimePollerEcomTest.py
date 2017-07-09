from twisted.internet import reactor
from twisted.internet.defer import Deferred
from twisted.trial import unittest

from peek_agent_pof.realtime.RealtimePollerEcomFactory import RealtimePollerEcomFactory


class RealtimePollerEcomTest(unittest.TestCase):
    def testEcom(self):
        updateData = [('D006c6591ATTR', 1234), ('D005561e1ATTR', 1235)]

        realtimePollerEcomFactory = RealtimePollerEcomFactory()
        realtimePollerEcomFactory.updateKeys(updateData)

        reactor.connectTCP('127.0.0.1', 15028, realtimePollerEcomFactory)

        # Just make the test keep going
        return Deferred()
