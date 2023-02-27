from typing import Optional

from peek_plugin_diagram._private.storage.Display import DispColor
from peek_plugin_diagram._private.storage.Display import DispLineStyle
from peek_plugin_diagram.worker.canvas_shapes.ShapeBase import Point
from peek_plugin_diagram.worker.canvas_shapes.ShapeBase import ShapeBase


class PolygonFillDirectionEnum:
    fillBottomToTop = 1
    fillRightToLeft = 2
    fillLeftToRight = 3


class ShapePolygon(ShapeBase):
    FILL_TOP_TO_BOTTOM = 0
    FILL_BOTTOM_TO_TOP = 1
    FILL_RIGHT_TO_LEFT = 2
    FILL_LEFT_TO_RIGHT = 3

    @staticmethod
    def fillColor(disp) -> DispColor:
        return disp.get("fcl")

    @staticmethod
    def lineColor(disp) -> DispColor:
        return disp.get("lcl")

    @staticmethod
    def lineStyle(disp) -> DispLineStyle:
        return disp.get("lsl")

    @staticmethod
    def lineWidth(disp) -> DispLineStyle:
        return disp.get("w")

    @staticmethod
    def cornerRadius(disp) -> float:
        return disp.get("cr")

    @staticmethod
    def fillDirection(disp) -> int:
        fillDirection = disp.get("fd")

        if fillDirection == PolygonFillDirectionEnum.fillBottomToTop:
            return PolygonFillDirectionEnum.fillBottomToTop

        if fillDirection == PolygonFillDirectionEnum.fillRightToLeft:
            return PolygonFillDirectionEnum.fillRightToLeft

        if fillDirection == PolygonFillDirectionEnum.fillLeftToRight:
            return PolygonFillDirectionEnum.fillLeftToRight

    @staticmethod
    def fillPercent(disp) -> Optional[float]:
        return float(disp.get("fp")) if disp.get("fp") else None

    @staticmethod
    def isRectangle(disp) -> bool:
        return bool(disp.get("r"))

    @staticmethod
    def center(disp) -> Point:
        # TODO
        raise NotImplementedError

    @staticmethod
    def contains(disp, point: Point, margin: float) -> bool:
        raise NotImplementedError

    @staticmethod
    def geom(disp):
        return disp.get("g")
