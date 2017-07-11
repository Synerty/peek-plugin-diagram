// ============================================================================
// Node Extensions

(function () {
    function nodeMove(x, y) {
        var self = this;
        self._move(x, y);
    }

    function nodeDeltaMove(dx, dy) {
        var self = this;
        self._deltaMove(dx, dy);

        if (self.nodeId == null)
            return;

        var nodeId = self.nodeId;

        var conns = networkModel.conductorsByNodeId[nodeId];

        // Move all but this conductor.
        for (var i = 0; conns != null && i < conns.length; i++) {
            var connItem = conns[i];
            var connRend = connItem.uiData.rend;

            if (connItem.srcId == nodeId) {
                connRend._deltaMoveHandle(dx, dy, null, 0);
            } else {
                connRend._deltaMoveHandle(dx, dy, null, connRend.points.length);
            }
        }
    }


    function nodeDeltaMoveHandle(dx, dy, handle, handleIndex) {
        var self = this;
        self._deltaMoveHandle(dx, dy, handle, handleIndex);
    }


    function nodeResize(w, h) {
        var self = this;
        self._resize(w, h);
    }

    function nodeDeltaResize(dw, dh) {
        var self = this;
        return self._deltaResize(dw, dh);
    }

    function nodeStoreState(delete_) {
        var self = this;

        if (self.nodeId == null)
            return;

        var node = networkModel.nodes[self.nodeId];

        if (delete_) {
            networkModel.deleteNode(node);
            return;
        }

        var tuples = [node];

        var conns = networkModel.conductorsByNodeId[node.id];
        if (conns != null)
            tuples.add(conns);

        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }

        tuples = tuples.filter(onlyUnique);

        networkModel.store(tuples);
    }


    function applyNodeExtension(RenderableClass) {
        // Inherited objects may need to override this
        RenderableClass.prototype._move = Renderable.prototype.move;
        RenderableClass.prototype.move = nodeMove;

        // Inherited objects may need to override this
        RenderableClass.prototype._deltaMove = Renderable.prototype.deltaMove;
        RenderableClass.prototype.deltaMove = nodeDeltaMove;


        // Inherited objects may need to override this
        RenderableClass.prototype._deltaMoveHandle = Renderable.prototype.deltaMoveHandle;
        RenderableClass.prototype.deltaMoveHandle = nodeDeltaMoveHandle;


        RenderableClass.prototype._resize = Renderable.prototype.resize;
        RenderableClass.prototype.resize = nodeResize;

        // Inherited objects may need to override this
        RenderableClass.prototype._deltaResize = Renderable.prototype.deltaResize;
        RenderableClass.prototype.deltaResize = nodeDeltaResize;


        // Inherited objects may need to override this
        RenderableClass.prototype.storeState = nodeStoreState;
    }


// ============================================================================
// Oval Renderable Node Extension
    applyNodeExtension(OvalRenderable);

// ============================================================================
// Rectangle Renderable Node Extension
    applyNodeExtension(RectangleRenderable);

}());