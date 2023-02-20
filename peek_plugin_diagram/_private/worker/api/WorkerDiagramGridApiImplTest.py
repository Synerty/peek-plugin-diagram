import logging
import sys
from unittest import TestCase


class WorkerDiagramGridApiImpl(TestCase):
    def setUp(self):
        # setup for `PeekPlatformConfig.config.bashLocation`
        logging.basicConfig(
            stream=sys.stdout,
            format="%(asctime)s %(levelname)s %(name)s:%(message)s",
            datefmt="%d-%b-%Y %H:%M:%S",
            level=logging.DEBUG,
        )
        from peek_platform import PeekPlatformConfig

        from peek_plugin_base.PeekVortexUtil import peekWorkerName

        PeekPlatformConfig.componentName = peekWorkerName

        # The config depends on the componentName, order is important
        from peek_worker_service.PeekWorkerConfig import PeekWorkerConfig

        PeekPlatformConfig.config = PeekWorkerConfig()

        # setup for `CeleryDbConn`
        from peek_plugin_base.worker import CeleryDbConn

        CeleryDbConn._dbConnectString = (
            PeekPlatformConfig.config.dbConnectString
        )
        CeleryDbConn._dbEngineArgs = PeekPlatformConfig.config.dbEngineArgs

    # Disabled, this needs specific data
    def _test_getGridKeysFromShapeKeys_All(self):
        from .WorkerDiagramGridApiImpl import WorkerDiagramGridApiImpl

        result = WorkerDiagramGridApiImpl.getGridKeysFromShapeKeys(
            "pofDiagram", "Distribution World", testKeys
        )
        self.assertTrue(result)

    # Disabled, this needs specific data
    def _test_getGridKeysFromShapeKeys_Smallest(self):
        from .WorkerDiagramGridApiImpl import WorkerDiagramGridApiImpl

        result = WorkerDiagramGridApiImpl.getGridKeysFromShapeKeys(
            "pofDiagram", "Distribution World", testKeys
        )
        self.assertTrue(result)


testKeys = [
    "k00020aa6COMP",
    "k00020b68COMP",
    "k0001a7cbCOMP",
    "k0001a846COMP",
    "k0001a87eCOMP",
    "k0001a705COMP",
    "k0001a902COMP",
    "k0001a848COMP",
    "k0001a87fCOMP",
    "k0001a8f8COMP",
    "k0001a901COMP",
    "k0001a8a1COMP",
    "k00020b2cCOMP",
    "k00020b15COMP",
    "k00020a7dCOMP",
    "k00020b22COMP",
    "k0001a82bCOMP",
    "k00020b7aCOMP",
    "k00020acbCOMP",
    "k00020b74COMP",
    "k00020af0COMP",
    "k00020afeCOMP",
    "k00020b96COMP",
    "k00020b3aCOMP",
    "k00020b57COMP",
    "k0001a864COMP",
    "k0001a582COMP",
    "k0007db66HOT",
    "k0001a429COMP",
    "k0007daedHOT",
    "k0001a43bCOMP",
    "k0007daf6HOT",
    "k000207a6COMP",
    "e0001b43eHOT",
    "k000207a5COMP",
    "e0001b43dHOT",
    "k000207a8COMP",
    "e00018fc1HOT",
    "k000207a9COMP",
    "e00018fc2HOT",
    "k000207acCOMP",
    "k0002070aCOMP",
    "e0001263eHOT",
    "k000206f4COMP",
    "e0001263fHOT",
    "k000206f8COMP",
    "e00012640HOT",
    "k0006c0beCOMP",
    "k0006c101COMP",
    "k0006bd23COMP",
    "k0006bff6COMP",
    "k0006c002COMP",
    "k0006bfc7COMP",
    "k0006c0f4COMP",
    "k0006c017COMP",
    "k0006c033COMP",
    "k0006beeeCOMP",
    "k0006bf3cCOMP",
    "k0006c052COMP",
    "k0006c089COMP",
    "k0006bdd5COMP",
    "k0006be8fCOMP",
]
