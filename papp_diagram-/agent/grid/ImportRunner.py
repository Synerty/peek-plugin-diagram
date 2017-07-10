import logging
from datetime import datetime

from peek_agent_pof.grid.imp_display.EnmacImportPages import EnmacImportPages
from peek_agent_pof.grid.imp_lookup.EnmacImportDispColor import EnmacImportDispColor
from peek_agent_pof.grid.imp_lookup.EnmacImportDispLayer import EnmacImportDispLayer
from peek_agent_pof.grid.imp_lookup.EnmacImportDispLevel import EnmacImportDispLevel
from peek_agent_pof.grid.imp_lookup.EnmacImportDispLineStyle import \
    EnmacImportDispLineStyle
from peek_agent_pof.grid.imp_lookup.EnmacImportDispTextStyle import \
    EnmacImportDispTextStyle
from twisted.internet import task
from twisted.internet.defer import DeferredList, succeed

logger = logging.getLogger(__name__)

OVERLAY_PERIOD = 2.0
PAGE_PERIOD = 30.0
LOOKUP_PERIOD = 120.0


class ImportRunner:
    def __init__(self):
        self._pollLoopingCall = task.LoopingCall(self._poll)
        self._lookupImporters = []
        self._pageImporters = []

        self._lastOverlayRun = datetime.utcnow()
        self._lastPageRun = datetime.utcnow()
        self._lastLookupRun = datetime.utcnow()

    def start(self):

        self._lookupImporters = [EnmacImportDispColor(),
                                 EnmacImportDispLayer(),
                                 EnmacImportDispLevel(),
                                 EnmacImportDispTextStyle(),
                                 EnmacImportDispLineStyle()]

        self._pageImporter = EnmacImportPages()

        def _startTimer(_):
            self._pollLoopingCall.start(1.0)
            return True


        dl = DeferredList([i.import_() for i in self._lookupImporters])
        dl.addCallback(lambda _: self._pageImporter.importPages())
        dl.addCallback(lambda _: self._pageImporter.importOverlays())
        dl.addCallback(_startTimer)
        return dl

    def stop(self):
        self._pollLoopingCall.stop()

    def _poll(self):
        # The timer doesn't resume until this deferred is called
        return DeferredList([self._importLookups(),
                             self._importPages(),
                             self._importOverlays()])

    def _importLookups(self):
        if (datetime.utcnow() - self._lastLookupRun).seconds < LOOKUP_PERIOD:
            return succeed(True)

        def updateTime(deferArg):
            self._lastLookupRun = datetime.utcnow()
            return deferArg

        d = DeferredList([i.import_() for i in self._lookupImporters])
        d.addCallback(updateTime)
        return d

    def _importOverlays(self, *args):
        if (datetime.utcnow() - self._lastOverlayRun).seconds < OVERLAY_PERIOD:
            return succeed(True)

        def updateTime(deferArg):
            self._lastOverlayRun = datetime.utcnow()
            return deferArg

        d = self._pageImporter.importOverlays()
        d.addCallback(updateTime)
        return d

    def _importPages(self, *args):
        if (datetime.utcnow() - self._lastPageRun).seconds < PAGE_PERIOD:
            return succeed(True)

        def updateTime(deferArg):
            self._lastPageRun = datetime.utcnow()
            return deferArg

        d = self._pageImporter.importPages()
        d.addCallback(updateTime)
        return d


importRunner = ImportRunner()
