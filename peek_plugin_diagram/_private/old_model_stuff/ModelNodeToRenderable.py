from geoalchemy2.shape import to_shape

from peek.core.import_util.ModelSetBaseline import ModelSetBaseline
from peek.core.orm.Renderable import OvalRenderable, RenderablePoly, \
    RenderablePolyPoint, RenderableRectangle

MODEL_NODE_RENDERERS = {}


def addNodeRenderer(baseNodeType):
    def f(func):
        MODEL_NODE_RENDERERS[baseNodeType] = func
        return func

    return f


def makeCircle(center, width, fillColor='', lineColor='', lineSize=2):
    r = OvalRenderable()
    r.fillColor = fillColor
    r.lineColor = lineColor
    r.left = center.x - width / 2
    r.top = center.y - width / 2
    r.width = width
    r.height = width
    r.lineSize = lineSize
    r.endAngle = 360
    r.startAngle = 0
    return r


def makeRectangle(center,
                  width, height=None, rotation=0,
                  fillColor='', lineColor='', lineSize=2):
    height = height if height else width
    r = RenderableRectangle()
    r.fillColor = fillColor
    r.lineColor = lineColor
    r.left = center.x - width / 2
    r.top = center.y - height / 2
    r.width = width
    r.height = height
    r.lineSize = lineSize
    r.rotation = rotation
    return r


# def makeTriangle(center,
#                   width, height=None, rotation=0,
#                   fillColor='', lineColour='', lineSize=2):
#     http://stackoverflow.com/questions/19225347/how-to-create-a-triangle-shaped-drawing-from-my-variables-in-python
#     # determine corner points of triangle with sides a, b, c
#     A = (0, 0)
#     B = (c, 0)
#     hc = (2 * (a**2*b**2 + b**2*c**2 + c**2*a**2) - (a**4 + b**4 + c**4))**0.5 / (2.*c)
#     dx = (b**2 - hc**2)**0.5
#     if abs((c - dx)**2 + hc**2 - a**2) > 0.01: dx = -dx # dx has two solutions
#     C = (dx, hc)
#
#     # move away from topleft, scale up a bit, convert to int
#     coords = [int((x + 1) * 75) for x in A+B+C]
#
#
#     height = height if height else width
#     r = RenderableRectangle()
#     r.fillColor = fillColor
#     r.lineColor = lineColour
#     r.left = center.x - width / 2
#     r.top = center.y - height / 2
#     r.width = width
#     r.height = height
#     r.lineSize = lineSize
#     r.rotation = rotation
#     return r


@addNodeRenderer(ModelSetBaseline.nodeRmu)
def _renderRmu(nodeCoord, point):
    return makeCircle(point, 6, "purple")


@addNodeRenderer(ModelSetBaseline.nodeGenerator)
def _renderGenerator(nodeCoord, point):
    return makeCircle(point, 10, fillColor="cyan", lineSize=2, lineColor="orange")


@addNodeRenderer(ModelSetBaseline.nodeRipplePlant)
def _renderRipplePlant(nodeCoord, point):
    return makeCircle(point, 10, fillColor="orange", lineSize=2, lineColor="cyan")


@addNodeRenderer(ModelSetBaseline.nodeSubOh)
def _renderFuse(nodeCoord, point):
    return makeCircle(point, width=10, fillColor="orange")


@addNodeRenderer(ModelSetBaseline.nodeSubUgOrGm)
def _renderFuse(nodeCoord, point):
    return makeRectangle(point, width=10, fillColor="purple",
                         rotation=nodeCoord.rotation)


@addNodeRenderer(ModelSetBaseline.nodePothead)
def _renderFuse(nodeCoord, point):
    # Linesize does nothing :-|
    return makeCircle(point, width=6, lineColor="purple", lineSize=2, fillColor="orange")


@addNodeRenderer(ModelSetBaseline.feederDiagramJoin)
def _renderFuse(nodeCoord, point):
    connectCount = (0
                    if not 'connects' in nodeCoord.node.props else
                    len(nodeCoord.node.props['connects']))

    return makeCircle(point, width=8, lineColor="green",
                      fillColor='green' if connectCount == 2 else 'white')


@addNodeRenderer(ModelSetBaseline.nodeSwitchAb)
@addNodeRenderer(ModelSetBaseline.nodeSwitchGm)
@addNodeRenderer(ModelSetBaseline.nodeSwitchGmEarth)
@addNodeRenderer(ModelSetBaseline.nodeSwitchGmEarth)
@addNodeRenderer(ModelSetBaseline.nodeRecloseOh)
@addNodeRenderer(ModelSetBaseline.nodeRecloseUg)
def _renderFuse(nodeCoord, point):
    closed = 'closed' in nodeCoord.node.props and nodeCoord.node.props['closed']
    return makeRectangle(point, width=8,
                         fillColor=("red" if closed else 'green'),
                         lineColor="red")


@addNodeRenderer(ModelSetBaseline.nodeFuse)
@addNodeRenderer(ModelSetBaseline.nodeSwitchFuse)
@addNodeRenderer(ModelSetBaseline.nodeLink)
def _renderFuse(nodeCoord, point):
    closed = 'closed' in nodeCoord.node.props and nodeCoord.node.props['closed']
    return makeCircle(point, width=8,
                         fillColor=("red" if closed else 'green'),
                         lineColor="red")


# @addNodeRenderer(ModelSetBaseline.nodeFuse)
# @addNodeRenderer(ModelSetBaseline.nodeSwitchFuse)
# def _renderFuse(nodeCoord, point):
#     return makeCircle(point, width=8, lineColor="red")


def createNodeRenderable(nodeCoord):
    baseNodeType = ModelSetBaseline.NODE_TYPES_BY_NAME[nodeCoord.node.type.name]

    point = to_shape(nodeCoord.point)

    if baseNodeType in MODEL_NODE_RENDERERS:
        r = MODEL_NODE_RENDERERS[baseNodeType](nodeCoord, point)

    else:
        isJoint = baseNodeType.isJoint
        isMajorSub = ModelSetBaseline.nodeSubMajor == baseNodeType

        width = 4 if isJoint else (16 if isMajorSub else 8)

        r = makeCircle(point, width=width,
                       fillColor=('green' if isJoint else 'red'))

    r.id = 'nodeCoord.%s' % nodeCoord.id
    if isinstance(r, RenderablePoly):
        r.uiData = {'points': list(r.points)}
    r.zorder = 3
    return r


def createConnRenderable(connCoord):
    baseNodeType = ModelSetBaseline.CONN_TYPES_BY_NAME[connCoord.conn.type.name]

    points = list(to_shape(connCoord.points).coords)

    if baseNodeType in MODEL_NODE_RENDERERS:
        r = MODEL_NODE_RENDERERS[baseNodeType](connCoord, points)

    else:

        r = RenderablePoly()
        r.left = points[0][0]
        r.top = points[0][1]
        r.lineColor = ('purple'
                       if connCoord.conn.type.name == ModelSetBaseline.connLineUg.name else
                       'orange')
        r.lineSize = 1
        r.closed = False

        for p in points[1:]:
            polyPoint = RenderablePolyPoint()
            polyPoint.index = len(r.points)
            polyPoint.left = p[0] - r.left
            polyPoint.top = p[1] - r.top
            r.points.append(polyPoint)

    r.id = 'connCoord.%s' % connCoord.id
    if isinstance(r, RenderablePoly):
        r.uiData = {'points': list(r.points)}
    r.zorder = 2
    return r
