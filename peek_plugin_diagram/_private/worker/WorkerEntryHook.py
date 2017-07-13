import logging

from peek_plugin_base.worker.PluginWorkerEntryHookABC import PluginWorkerEntryHookABC
from peek_plugin_diagram._private.worker.tasks import GridKeyCompilerTask, \
    ImportDispTask, LiveDbDisplayValueConverterTask, DispCompilerTask

logger = logging.getLogger(__name__)


class WorkerEntryHook(PluginWorkerEntryHookABC):
    def load(self):
        logger.debug("loaded")

    def start(self):
        logger.debug("started")

    def stop(self):
        logger.debug("stopped")

    def unload(self):
        logger.debug("unloaded")

    @property
    def celeryAppIncludes(self):
        return [DispCompilerTask.__name__,
                GridKeyCompilerTask.__name__,
                LiveDbDisplayValueConverterTask.__name__,
                ImportDispTask.__name__]

    @property
    def celeryApp(self):
        from .CeleryApp import celeryApp
        return celeryApp
