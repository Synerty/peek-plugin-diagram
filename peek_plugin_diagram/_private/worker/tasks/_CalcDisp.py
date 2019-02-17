import logging
from typing import List

from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet

logger = logging.getLogger(__name__)


def _scaleDispGeomWithCoordSet(points: List[float],
                               coordSet: ModelCoordSet) -> List[float]:
    return _scaleDispGeom(points,
                          coordSet.multiplierX,
                          coordSet.multiplierY,
                          coordSet.offsetX,
                          coordSet.offsetY)


def _scaleDispGeom(points: List[float],
                   mx: float, my: float, ox: float, oy: float) -> List[float]:
    newGeom: List[float] = []

    for xi in range(0, len(points), 2):
        x = points[xi] * mx + ox
        y = points[xi + 1] * my + oy

        newGeom += [x, y]

    return newGeom
