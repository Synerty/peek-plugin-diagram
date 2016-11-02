"""
 *
 *  Copyright Synerty Pty Ltd 2013
 *
 *  This software is proprietary, you are not free to copy
 *  or redistribute this code in any format.
 *
 *  All rights to this software are reserved by 
 *  Synerty Pty Ltd
 *
 * Website : http://www.synerty.com
 * Support : support@synerty.com
 *
"""

from peek_agent.AgentConfig import AgentConfig
import logging

logger = logging.getLogger(__name__)


class PofAgentConfig(AgentConfig):
    """
    This is the PoF agent configuration

    """

    pofModelSetName = "PowerOn Fusion"

    # ------------ ENMAC SECTION -------------
    _enmacConfigSection = 'enmac_config'

    _enmacLayerProfileName = "layer_profile"
    _defaultEnmacLayerProfileName = "ED_PROFILE"

    _enmacEwebmonHost = "ewebmon_host"
    _defaultEnmacEwebmonHost = "127.0.0.1"

    _enmacEwebmonPort = "ewebmon_port"
    _defaultEnmacEwebmonPort = 15028

    @classmethod
    def initialise(cls):
        AgentConfig.initialise(
            agentHomeName="peek_agent_pof",
            agentSymlinkName="peek_agent_pof",
            agentName="Peek Agent PoF",
            modelSetName=cls.pofModelSetName)

    def __init__(self):
        AgentConfig.__init__(self)

    @property
    def layerProfileName(self):
        return self._getStr(self._enmacConfigSection,
                            self._enmacLayerProfileName,
                            self._defaultEnmacLayerProfileName)

    @property
    def ewebmonServerHost(self):
        return self._getStr(self._enmacConfigSection,
                            self._enmacEwebmonHost,
                            self._defaultEnmacEwebmonHost)

    @property
    def ewebmonServerPort(self):
        return self._getInt(self._enmacConfigSection,
                            self._enmacEwebmonPort,
                            self._defaultEnmacEwebmonPort)


PofAgentConfig.initialise()
pofAgentConfig = PofAgentConfig()
