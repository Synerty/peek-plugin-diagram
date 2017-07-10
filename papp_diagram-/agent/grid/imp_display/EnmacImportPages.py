import logging
import os
from collections import namedtuple
from datetime import datetime

from peek_agent.PeekVortexClient import sendPayloadToPeekServer, sendVortexMsgToPeekServer
from peek_agent.orm.AgentData import AgentImportDispGridInfo
from peek_agent_pof.grid.imp_display.EnmacImportPage import EnmacImportPage
from peek_agent_pof.imp_model.EnmacOrm import getEnmacWorlds
from twisted.internet.defer import inlineCallbacks
from twisted.internet.threads import deferToThread
from twisted.internet.utils import getProcessOutput

from txhttputil import Payload
from txhttputil import PayloadEndpoint

logger = logging.getLogger(__name__)


class EnmacImportPages:
    """ Enmac Import Pages

    Check if we have not imported them or if they have been updated, then import them

    """

    PARALLELISM = 20

    def __init__(self):
        self._dispGridInfoByKey = {}
        self._infoLoaded = False

        self._infoFilt = {'key': "c.s.p.ai.disp_grid_info"}

        self._infoEndpoint = PayloadEndpoint(self._infoFilt, self._loadInfoTuples)

        self._pushSuccessFilt = {'key': "c.s.p.ai.grid_update_success"}

        self._successEndpoint = PayloadEndpoint(self._pushSuccessFilt, self._pushSuccess)

        payload = Payload()
        payload.filt = self._infoFilt
        sendPayloadToPeekServer(payload)

        self._queuePages = {}
        self._inProgressPages = set()

        self._worlds = getEnmacWorlds()

    # ------------------------------------------------------------------------------------
    # INFO METHODS

    def _makeInfoKey(self, info):
        return info.dispGridRef  # It's the filename, that's unique

    def _loadInfoTuples(self, payload, **kwargs):

        logger.debug("Loading %s disp grid info items" % len(payload.tuples))

        for info in payload.tuples:
            key = self._makeInfoKey(info)
            info.updateInProgressDate = None
            self._dispGridInfoByKey[key] = info

            if key in self._inProgressPages:
                self._inProgressPages.remove(key)

        self._infoLoaded = True

        self._processNext()

    def _pushSuccess(self, payload, *args, **kwargs):
        infoKey = payload.filt['infoKey']
        logger.debug("Recieved update success for disp grid %s" % infoKey)

        info = self._dispGridInfoByKey[infoKey]
        info.lastImportHash = payload.filt['hash']
        info.lastImportDate = payload.filt['date']
        # Update is still in progress until we get it back
        # info.updateInProgressDate = None

        payload = Payload()
        payload.filt = self._infoFilt
        payload.tuples = [info]
        sendPayloadToPeekServer(payload)

    def _getInfo(self, worldName, pageFilePath):
        key = pageFilePath

        if key in self._dispGridInfoByKey:
            return self._dispGridInfoByKey[key]

        from peek_agent_pof.PofAgentConfig import pofAgentConfig
        info = AgentImportDispGridInfo(modelSetName=pofAgentConfig.modelSetName,
                                       coordSetName=worldName,
                                       dispGridRef=pageFilePath)

        self._dispGridInfoByKey[key] = info
        return info

    # ------------------------------------------------------------------------------------
    # LOADER METHODS
    def importPages(self, *args):
        return self._import("????????")

    def importOverlays(self, *args):
        return self._import("????????.ov")

    @inlineCallbacks
    def _import(self, filePattern):
        if not self._infoLoaded:
            return

        for world in self._worlds:
            pageImporter = EnmacImportPage(world.name)

            FileDetails = namedtuple('FileDetails', ['size', 'date', 'name'])

            lsCmd = '''ls --full-time %s | awk {'print $5"|"$6" "$7" "$8"|"$9'}'''
            lsCmd %= os.path.join(world.location, filePattern)

            try:
                output = yield getProcessOutput('/bin/bash', ['-c', lsCmd],
                                                errortoo=True)

            except Exception as e:
                if 'No such file or directory' in e.message:
                    continue

            # TODO, Handle when files are deleted

            output = [line for line in output.splitlines() if '|' in line]

            for line in output:
                fileDetails = FileDetails(*line.split('|'))

                if int(fileDetails.size) < 30:
                    continue

                info = self._getInfo(world.name, fileDetails.name)
                infoKey = self._makeInfoKey(info)

                date = datetime.utcnow()

                if info.updateInProgressDate is not None:
                    diffSeconds = (date - info.updateInProgressDate).seconds
                    if diffSeconds < 1800:  # Half an hour
                        continue

                if infoKey in self._queuePages:
                    self._queuePages.pop(infoKey)

                if infoKey in self._inProgressPages:
                    self._inProgressPages.remove(infoKey)

                hash = fileDetails.date

                if info.lastImportHash == hash:
                    continue

                info.updateInProgressDate = datetime.utcnow()

                self._queuePages[infoKey] = (pageImporter, fileDetails.name,
                                             date, hash, world.name)

        self._processNext()

    def _processNext(self):
        while len(self._inProgressPages) < self.PARALLELISM and len(self._queuePages):
            infoKey, data = self._queuePages.popitem()
            self._inProgressPages.add(infoKey)
            self._importPage(infoKey, data)

    def _importPage(self, infoKey, data):
        pageImporter, fileNamePath, date, hash, worldName = data

        @inlineCallbacks
        def pushUpdate(newDisps):
            # We only want to mark the send successful if the
            vortexMsg = yield deferToThread(self._createPayloadBlocking,
                                            infoKey, date, hash,
                                            newDisps, worldName)

            logger.debug("Sending disp grid update payload for %s" % fileNamePath)
            sendVortexMsgToPeekServer(vortexMsg)

        def err(failure):
            self._inProgressPages.remove(infoKey)
            self._processNext()
            return failure

        d = pageImporter.import_(fileNamePath)
        d.addCallback(pushUpdate)
        d.addErrback(err)
        return d

    # def _hashFile(self, fileNamePath):
    #     blocksize = 65536
    #
    #     hasher = hashlib.sha256()
    #     with open(fileNamePath, 'rb') as f:
    #         buf = f.read(blocksize)
    #         while len(buf) > 0:
    #             hasher.update(buf)
    #             buf = f.read(blocksize)
    #         return hasher.hexdigest()[0:40]

    # -------------------------------------------------------


    def _createPayloadBlocking(self, infoKey, date, hash, disps, coordSetName):
        from peek_agent_pof.PofAgentConfig import pofAgentConfig

        payload = Payload()
        # Key to route the payload
        payload.filt['key'] = "c.s.p.import.disp_grid"

        # The server loader needs these
        payload.filt['modelSetName'] = pofAgentConfig.modelSetName
        payload.filt['coordSetName'] = coordSetName
        payload.filt['importGroupHash'] = infoKey

        # These are returned to us on success
        payload.filt['infoKey'] = infoKey
        payload.filt['date'] = date
        payload.filt['hash'] = hash

        payload.tuples = disps

        # Convert to XML in thread.
        return payload.toVortexMsg()
