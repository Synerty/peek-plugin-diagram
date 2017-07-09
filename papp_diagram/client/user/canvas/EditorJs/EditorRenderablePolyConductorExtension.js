// ============================================================================
// Poly Point Conductor Extension

// Inherited objects may need to override this

PolyRenderable.prototype._deltaResize = PolyRenderable.prototype.deltaResize;
PolyRenderable.prototype.deltaResize = function (dw, dh) {
    var self = this;
    self._deltaResize(dw, dh);

    // UPDATE CONN
};


// Inherited objects may need to override this
PolyRenderable.prototype._deltaMoveHandle = PolyRenderable.prototype.deltaMoveHandle;
PolyRenderable.prototype.deltaMoveHandle = function (dx, dy, handle, handleIndex) {
    var self = this;
    self._deltaMoveHandle(dx, dy, handle, handleIndex);

    if (self.connId == null)
        return;

    var conn = networkModel.conductors[self.connId];

    var nodeId = null;
    if (handleIndex == 0) {
        nodeId = conn.srcId;
    }
    else if (handleIndex == self.points.length) {
        nodeId = conn.dstId;
    }

    if (nodeId == null)
        return;

    var node = networkModel.nodes[nodeId];
    var conns = networkModel.conductorsByNodeId[nodeId];

    // Move Node
    var nodeRend = node.uiData.rend;
    nodeRend._deltaMove(dx, dy);

    // Move all but this conductor.
    for (var i = 0; conns != null && i < conns.length; i++) {
        var connItem = conns[i];
        if (connItem.id == self.connId)
            continue;
        var connRend = connItem.uiData.rend;

        if (connItem.srcId == nodeId) {
            connRend._deltaMoveHandle(dx, dy, null, 0);
        } else {
            connRend._deltaMoveHandle(dx, dy, null, connRend.points.length);
        }
    }

// UPDATE CONN
};


//PolyRenderable.prototype._typeName = PolyRenderable.prototype.typeName;
//PolyRenderable.prototype.typeName = function () {
//    var self = this;
//    if (self.conn == null) {
//        return self.conn.layerName();
//    }
//
//    return PolyRenderable.prototype._typeName();
//};


//PolyRenderable.prototype._toString = PolyRenderable.prototype.toString;
//PolyRenderable.prototype.toString = function () {
//    var self = this;
//
//    var str = '';
//
//        str = self.conn.layerName() + '\n';
//
//    return str + self._toString();
//};

// ---------------
// Image specific functions

PolyRenderable.prototype._movePoint = PolyRenderable.prototype.movePoint;
PolyRenderable.prototype.movePoint = function (index, x, y) {
    var self = this;
    self._movePoint(index, x, y);

    // I don't think this is used
};


// Inherited objects may need to override this
PolyRenderable.prototype.delete = function () {
    var self = this;

    if (self.connId == null)
        return;
};


// Inherited objects may need to override this
PolyRenderable.prototype.storeState = function (delete_) {
    var self = this;

    if (self.connId == null)
        return;

    var conn = networkModel.conductors[self.connId];

    if (delete_) {
        networkModel.deleteConn(conn);
        return;
    }

    var tuples = [conn];

    function addConns(nodeId) {
        // Add the node
        tuples.push(networkModel.nodes[nodeId]);

        // Add the conns
        var conns = networkModel.conductorsByNodeId[nodeId];
        if (conns != null)
            tuples.add(conns);

    }

    addConns(conn.srcId);
    addConns(conn.dstId);

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    tuples = tuples.filter(onlyUnique);

    networkModel.store(tuples);
};


