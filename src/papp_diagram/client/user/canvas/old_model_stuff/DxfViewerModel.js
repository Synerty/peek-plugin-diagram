'use strict';


function updateSelectedRenderableNodesClosedState(closed) {
    var rends = editorModel.selectedRenderables();
    var updatedNodes = [];
    for (var i = 0; i < rends.length; i++) {
        var rend = rends[i];

        if (rend.nodeId == null)
            continue;
        var node = networkModel.nodes[rend.nodeId];
        if (node == null || node.props.closed == null)
            continue;
        node.props.closed = closed;
        updatedNodes.push(node);
    }

    if (updatedNodes.length) {
        vortexSendTuple({
            "c.s.mod.dxf.model.update": null
        }, updatedNodes);
    }
}


requirejs(["angular", "jquery"], function () {
// -------------------------- Placeholder Module -----------------------
    var peekDxfViewerModel = angular.module('peekDxfViewerModel',
            ['peekDxfViewerModelTrace']);

    function nodeConnToRenderable(scope, nodeOrConn) {
        // console.log("Converting ", tuple.type, tuple._tupleType);
        var renderable = nodeOrConn.uiData.rend;

        if (renderable._tupleType === 'canvas.renderable.poly') {
            var conn = nodeOrConn;
            renderable.originalLineColor = renderable.lineColor;
            renderable.points = renderable.uiData.points;
            renderable.connId = conn.id;
            renderable.layerId = 'msc.' + conn.typeId;
            scope.pageData.conductors.add(conn);

            var startNodeEnds = scope.pageData.conductorsByNodeId[conn.srcId];
            if (startNodeEnds == null) {
                startNodeEnds = [];
                scope.pageData.conductorsByNodeId[conn.srcId] = startNodeEnds;
            }
            startNodeEnds.push(conn);

            var endNodeEnds = scope.pageData.conductorsByNodeId[conn.dstId];
            if (endNodeEnds == null) {
                endNodeEnds = [];
                scope.pageData.conductorsByNodeId[conn.dstId] = endNodeEnds;
            }
            endNodeEnds.push(conn);

        } else {
            var node = nodeOrConn;
            renderable.originalFillColor = renderable.fillColor;
            renderable.originalLineColor = renderable.lineColor;
            renderable.nodeId = node.id;
            renderable.layerId = 'msn.' + node.typeId;
            scope.pageData.nodes.add(node);

        }


        return renderable;
    }

    // ------ peekDxfViewerModelCtrl
    peekDxfViewerModel.controller('peekDxfViewerModelCtrl', [
        '$scope',
        function ($scope) {
            var self = this;


        }
    ]);

    // ------ peekDxfViewerModelCtrl
    peekDxfViewerModel.controller('peekDxfViewerToolbarCtrl', [
        '$scope',
        function ($scope) {
            var self = this;

            // -- EXTRACT MODEL -----------------------
            var extractCommandFilt = "c.s.mod.dxf.model.extract_command";
            $scope.extractModel = function () {
                var filt = {
                    id: $scope.pageData.selectedFileId
                };
                filt[extractCommandFilt] = null;
                vortexSendFilt(filt);
                logInfo("Extract command sent to server");
            };

            function processExtractPayloadMessage(payload) {
                if (payload.result)
                    logError(payload.result);
                else
                    logSuccess("Model has been successfully extracted")
            }

            new PayloadEndpoint(extractCommandFilt, processExtractPayloadMessage, $scope);

            // -- APPLY RULES  -------------------------
            var applyRulesCommandFilt = "c.s.mod.dxf.model.apply_rules_command";
            $scope.applyModelRules = function () {
                var filt = {
                    id: $scope.pageData.selectedFileId
                };
                filt[applyRulesCommandFilt] = null;
                vortexSendFilt(filt);
                logInfo("Apply rules command sent to server");
            };

            function processApplyRulesPayloadMessage(payload) {
                if (payload.result)
                    logError(payload.result);
                else
                    logSuccess("Rules have been successfully extracted")
            }

            new PayloadEndpoint(applyRulesCommandFilt, processApplyRulesPayloadMessage, $scope);

            // -- MODEL VIEW MODES --------------------
            $scope.DXF_VIEW = 1;
            $scope.MODEL_VIEW = 2;
            $scope.currentView = $scope.MODEL_VIEW;

            self.updateViewMode = function () {
                // Change color of DXF Renderables
                var list = $scope.pageData.dxfRenderables;
                for (var i = 0; i < list.length; ++i) {
                    var rend = list[i];
                    if ($scope.currentView == $scope.MODEL_VIEW) {
                        if (rend._lineColorBak) rend.lineColor = 'grey';
                        if (rend._fillColorBak) rend.fillColor = 'grey';
                    } else {
                        rend.lineColor = rend._lineColorBak;
                        rend.fillColor = rend._fillColorBak;
                    }
                }

                // Hide Model
                if ($scope.currentView == $scope.MODEL_VIEW) {
                    if ($scope.pageData.modelRenderablesHidden.length)
                        $scope.pageData.modelRenderables = $scope.pageData.modelRenderablesHidden;
                } else {
                    $scope.pageData.modelRenderablesHidden = $scope.pageData.modelRenderables;
                    $scope.pageData.modelRenderables = [];
                }


                for (var i = 0; i < $scope.pageData.modelLayers.length; ++i) {
                    $scope.pageData.modelLayers[i].selectable =
                            $scope.currentView == $scope.MODEL_VIEW
                }


                var oldScope = editorModel._scope;
                editorModel.setScope();
                $scope.updateRenderables();

                editorRenderer.invalidate();

                editorModel.setScope(oldScope);
            };

            // Make the DXF grey if we're in model mode
            $scope.$watch('currentView', self.updateViewMode);
            $scope.$watch('pageData.dxfRenderables', self.updateViewMode);


            self.loader = new AngFormLoadController($scope,
                    "c.s.mod.dxf.model.data", {
                        dataIsArray: true,
                        scopeObjIdName: 'pageData.selectedFileId'
                    });

            $scope.reloadModel = function () {
                self.loader.load();
            };

            $scope.pageMethods.processModelObj = function (item) {
                if (item._tupleType == 'model.nodetype') {
                    item.id = 'msn.' + item.id;
                    item.visible = true;

                    var layers = $scope.pageData.modelLayers;
                    for (var i = 0; i < layers.length; i++) {
                        if (layers[i].id === item.id)
                            break
                    }
                    if (i === layers.length)
                        layers.push(item);

                } else if (item._tupleType == 'model.conntype') {
                    item.id = 'msc.' + item.id;
                    item.visible = true;

                    var layers = $scope.pageData.modelLayers;
                    for (var i = 0; i < layers.length; i++) {
                        if (layers[i].id === item.id)
                            break
                    }
                    if (i === layers.length)
                        layers.push(item);

                } else {
                    $scope.pageData.modelRenderables.push(nodeConnToRenderable($scope, item));
                }
            };

            // Create references to our tuples
            self.processData = function () {
                $scope.pageData.resetModel();

                for (var i = 0; i < $scope.data.length; ++i) {
                    $scope.pageMethods.processModelObj($scope.data[i]);
                }

                $scope.updateLayers();
                $scope.updateRenderables();
                self.updateViewMode();

                $scope.$apply();
                logSuccess("Model Loaded");

            };

            self.loader.loadCallback.add(bind(self, self.processData));
            //self.loader.saveCallback.add(bind(self, self.separateData));

            $scope.$watch('pageData.dxfLayers', function () {
                editorRenderer.invalidate();
            }, true);

            $scope.nodeSearch = null;
            $scope.searchForNode = function () {
                editorModel.clearSelection(false);

                if (!$scope.nodeSearch)
                    return;

                var lowerSearch = $scope.nodeSearch.toLowerCase();

                var nodes = networkModel.nodes.toArray();
                var selectNodes = [];
                for (var i = 0; i < nodes.length; ++i) {
                    var node = nodes[i];

                    if (node.props.name != null
                            && node.props.name.toLowerCase().indexOf(lowerSearch) != -1)
                        selectNodes.push(node.uiData.rend);

                    else if (node.props.compareId != null
                            && node.props.compareId.toLowerCase().indexOf(lowerSearch) != -1)
                        selectNodes.push(node.uiData.rend);
                }

                editorModel.addSelection(selectNodes, false);

            };

        }
    ]);

// ------ peekDxfViewerModelCtrl
    peekDxfViewerModel.controller('PeekDxfViewerToolboxZoomCtrl', [
        '$scope',
        function ($scope) {
            var self = this;

            function zoomToString() {
                return $scope.zoom.toString(2);
            }

            $scope.zoomSelectVal = zoomToString();

            $scope.$watch("zoom", function () {
                $scope.zoomSelectVal = zoomToString();
            });

            self.updateZoom = function () {
                var newZoom = parseFloat($scope.zoomSelectVal);
                var multiplier = newZoom / $scope.zoom;
                setTimeout(function () {
                    editorRenderer.zoom(multiplier);
                    $scope.$apply();
                }, 1.0);
            };

            $scope.zoomOptions = [
                "0.10",
                "0.20",
                "0.30",
                "0.40",
                "0.50",
                "0.60",
                "0.70",
                "0.80",
                "0.90",
                "1.00",
                "2.00",
                "3.00",
                "4.00",
                "5.00",
                "6.00",
                "7.00",
                "8.00",
                "9.00",
                "10.00"
            ];
        }
    ]);


// ------ peekDxfViewerModelCableCtrl
    peekDxfViewerModel.controller('peekDxfViewerModelTabPropUpdateCtrl', [
        '$scope',
        function ($scope) {
            var self = this;

            function reset() {
                $scope.propUpdate = {
                    node: null,
                    conn: null,
                    showNode: false,
                    showConn: false
                };
            }

            reset();


            $scope.$watch(function () {
                return editorModel.selectedRenderables().length;
            }, function () {
                var selectedRenderables = editorModel.selectedRenderables();
                reset();

                if (!selectedRenderables || !selectedRenderables.length)
                    return;

                var rend = selectedRenderables[0];
                if (rend.nodeId) {
                    $scope.propUpdate.node = networkModel.nodes[rend.nodeId];
                    $scope.propUpdate.showNode = true;

                } else if (rend.connId) {
                    $scope.propUpdate.conn = networkModel.conductors[rend.connId];
                    $scope.propUpdate.showConn = true;

                }
            });

            $scope.savePropUpdate = function () {
                if ($scope.propUpdate.node)
                    vortexSendTuple($scope.modelUpdateFilt, $scope.propUpdate.node);

                else if ($scope.propUpdate.conn)
                    vortexSendTuple($scope.modelUpdateFilt, $scope.propUpdate.conn);
            };


            new AngFormLoadController($scope,
                    "c.s.mod.modelset.node.types.lookup", {
                        objName: 'nodeTypeLookup',
                        dataIsArray: true
                    });

            new AngFormLoadController($scope,
                    "c.s.mod.modelset.conn.types.lookup", {
                        objName: 'connTypeLookup',
                        dataIsArray: true
                    });


        }]);
// ------ peekDxfViewerModelCableCtrl
    peekDxfViewerModel.controller('peekDxfViewerModelCableCtrl', [
        '$scope',
        function ($scope) {
            var self = this;

            $scope.creatingCable = false;

            $scope.connLineOh3ph = "3PH OH Line";
            $scope.connLineOh2ph = "2PH OH Line";
            $scope.connLineOh1ph = "1PH OH Line";
            $scope.connLineUg = "UG Line";

            var newCableFilt = {"c.s.mod.dxf.model.cable.create": null};

            $scope.createCable = function (type) {
                $scope.creatingCable = type;
                editorUi.canvasMouse.setTool(Tools.prototype.TOOL_POLY);
            };

            $scope.pageMethods.cableCreateCallback = function (poly, startNodeRend, endNodeRend) {
                editorUi.canvasMouse.setTool(Tools.prototype.TOOL_SELECT);
                var newType = $scope.creatingCable;
                $scope.creatingCable = null;
                $scope.$apply();

                if (!poly)
                    return;

                if (startNodeRend.nodeId == endNodeRend.nodeId) {
                    logError("The start and end nodes are the same");
                    return;
                }

                // Conductor Types
                poly.uiData = {
                    startNodeId: startNodeRend.nodeId,
                    endNodeId: endNodeRend.nodeId,
                    dxfId: $scope.pageData.selectedFileId,
                    type: newType
                };

                vortexSendTuple(newCableFilt, poly);
            };

            function processNewTuple(payload) {
                for (var i = 0; i < payload.tuples.length; ++i) {
                    $scope.pageMethods.processModelObj(payload.tuples[i]);
                }

                $scope.updateLayers();
                $scope.updateRenderables();

                $scope.$apply();
            }

            new PayloadEndpoint(newCableFilt, processNewTuple, $scope);


        }]);


// ------ peekDxfViewerModelNodeCtrl
    peekDxfViewerModel.controller('peekDxfViewerModelNodeCtrl', [
        '$scope',
        function ($scope) {
            var self = this;

            $scope.creatingNode = false;

            $scope.feederDiagramJoin = "DXF Page Join";
            $scope.ugJoin = "Conductor Join UG";
            $scope.ohJoin = "Conductor Join OH";

            var newNodeFilt = {"c.s.mod.dxf.model.node.create": null};

            $scope.allVisible = function () {
                for (var i = 0; i < $scope.pageData.dxfLayers.length; i++) {
                    $scope.pageData.dxfLayers[i].visible = true;
                }
            };

            $scope.allSelectable = function () {
                for (var i = 0; i < $scope.pageData.dxfLayers.length; i++) {
                    $scope.pageData.dxfLayers[i].selectable = true;
                }
            };

            $scope.createNode = function (type) {
                $scope.creatingNode = type;
                editorUi.canvasMouse.setTool(Tools.prototype.TOOL_OVAL);
            };

            $scope.pageMethods.nodeCreateCallback = function (oval) {
                editorUi.canvasMouse.setTool(Tools.prototype.TOOL_SELECT);
                var newType = $scope.creatingNode;
                $scope.creatingNode = null;
                $scope.$apply();

                if (!oval)
                    return;

                var createOnRendId = null;

                if (editorModel.selectedRenderables().length) {
                    var rend = editorModel.selectedRenderables()[0];
                    if (rend.connId != null)
                        createOnRendId = rend.id;
                }

                // Conductor Types
                if (newType == $scope.feederDiagramJoin) {
                    var nodeName = prompt("Please enter the name of the joint");
                    if (nodeName == null) {
                        logWarning("A page join must have a name");
                        return;
                    }
                }

                oval.uiData = {
                    name: nodeName,
                    dxfId: $scope.pageData.selectedFileId,
                    type: newType,
                    createOnRendId: createOnRendId
                };

                vortexSendTuple(newNodeFilt, oval);
            };

            function processNewTuple(payload) {
                for (var i = 0; i < payload.tuples.length; ++i) {
                    $scope.pageMethods.processModelObj(payload.tuples[i]);
                }

                $scope.updateLayers();
                $scope.updateRenderables();

                $scope.$apply();
            }

            new PayloadEndpoint(newNodeFilt, processNewTuple, $scope);


        }]);

});