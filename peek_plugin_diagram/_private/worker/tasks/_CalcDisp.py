import logging
from typing import List

from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet

logger = logging.getLogger(__name__)


def _scaleDispGeom(points: List[float], coordSet: ModelCoordSet) -> List[float]:
    newGeom = []

    for xi in range(0, len(points), 2):
        x = points[xi] * coordSet.multiplierX + coordSet.offsetX
        y = points[xi + 1] * coordSet.multiplierY + coordSet.offsetY

        newGeom += [x, y]

    return newGeom
