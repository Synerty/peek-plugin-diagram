#!/usr/bin/env python
"""
 * synnova.py
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

from rapui import LoggingSetup

LoggingSetup.setup()

from twisted.internet import reactor

from rapui import RapuiConfig
from rapui.DeferUtil import printFailure
from rapui.util.Directory import DirSettings

RapuiConfig.enabledJsRequire = False

import logging

# EXAMPLE LOGGING CONFIG
# Hide messages from vortex
# logging.getLogger('rapui.vortex.VortexClient').setLevel(logging.INFO)

# logging.getLogger('peek_agent_pof.realtime.RealtimePollerEcomProtocol'
#                   ).setLevel(logging.INFO)

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------------------
# Set the parallelism of the database and reactor
reactor.suggestThreadPoolSize(10)


def main():
    # defer.setDebugging(True)
    # sys.argv.remove(DEBUG_ARG)
    # import pydevd
    # pydevd.settrace(suspend=False)

    from peek_agent_pof.PofAgentConfig import pofAgentConfig

    # Set default logging level
    logging.root.setLevel(pofAgentConfig.loggingLevel)

    # Initialise the rapui Directory object
    DirSettings.defaultDirChmod = pofAgentConfig.defaultDirChmod
    DirSettings.tmpDirPath = pofAgentConfig.tmpPath

    # First, setup the Vortex Agent
    from peek_agent.PeekVortexClient import connectVortexClient
    d = connectVortexClient(pofAgentConfig)

    # Start Update Handler,
    from peek_agent.sw_update.AgentSwUpdateHandler import agentSwUpdateHandler
    d.addCallback(lambda _: agentSwUpdateHandler.start())

    # Start the grid importer
    from peek_agent_pof.grid.ImportRunner import importRunner
    d.addCallback(lambda _: importRunner.start())

    # Start Realtime,
    from peek_agent_pof.realtime.RealtimeHandler import realtimeHandler
    d.addCallback(lambda _: realtimeHandler.start())

    d.addErrback(printFailure)

    # Init the realtime handler

    logger.info('PoF Peek Agent is running')
    reactor.run()


if __name__ == '__main__':
    main()
