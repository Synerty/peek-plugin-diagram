'use strict';

(function () {
// -------------------------- Placeholder Module -----------------------
    var peekDxfViewerModelTrace = angular.module('peekDxfViewerModelTrace', []);

    // ------ peekDxfViewerModelTraceCtrl
    peekDxfViewerModelTrace.controller('peekDxfViewerModelTraceCtrl', [
        '$scope',
        function ($scope) {
            var self = this;

            $scope.traceStatus = false;

            $scope.trace = function () {
                function showHelp() {
                    logWarning("You must select a node to start the trace from.");
                    $scope.traceStatus = false;
                }

                if ($scope.traceStatus)
                    return traceOff();

                if (!editorModel.selectedRenderables().length)
                    return showHelp();

                var rend = editorModel.selectedRenderables()[0];
                if (rend.nodeId == null)
                    return showHelp();

                return traceOn(rend.nodeId);
            };


            function traceOn(startNodeId) {
                $scope.traceStatus = true;
                logSuccess("TRACE ON");
                
                var ON_COLOR = 'white';

                function traceConn(conn) {
                    var rend = conn.uiData.rend;
                    if (rend.lineColor == ON_COLOR)
                        return;
                    
                    rend.lineColor = ON_COLOR;
                    
                    traceNode(networkModel.nodes[conn.srcId]);
                    traceNode(networkModel.nodes[conn.dstId]);
                }

                function traceNode(node) {
                    var rend = node.uiData.rend;
                    if (rend.fillColor == ON_COLOR)
                        return;

                    rend.fillColor = ON_COLOR;
                    rend.lineColor = ON_COLOR;

                    var conns = networkModel.conductorsByNodeId[node.id];
                    for (var i = 0; conns != null && i < conns.length; ++i) {
                        traceConn(conns[i]);
                    }
                }

                traceNode(networkModel.nodes[startNodeId]);
                editorRenderer.invalidate();

            }

            function traceOff() {
                $scope.traceStatus = false;
                logSuccess("TRACE OFF");
                for (var i = 0; i < networkModel.modelRenderables.length; i++) {
                    var rend = networkModel.modelRenderables[i];

                    if (rend.originalLineColor != null)
                        rend.lineColor = rend.originalLineColor;

                    if (rend.originalFillColor != null)
                        rend.fillColor = rend.originalFillColor;
                }

                editorRenderer.invalidate();
            }


        }]);

});