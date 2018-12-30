import logging
from typing import List

from txcelery.defer import DeferrableTask

from peek_plugin_diagram._private.worker.CeleryApp import celeryApp

logger = logging.getLogger(__name__)


@DeferrableTask
@celeryApp.task(bind=True)
def removeBranchs(self, modelSetKey: str, keys: List[str]) -> None:
    pass
