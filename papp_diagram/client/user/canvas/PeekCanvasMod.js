/**
 * Created by peek on 27/05/15.
 */

/**
 * Created by peek_server on 27/05/15.
 */

'use strict';

define("PeekCanvasMod", [
            // Named Dependencies
            "PeekCanvasModel",
            "PeekCanvasMouse",
            "PeekCanvasMouseSelectDelegate",
            "PeekDispRefData",
            "PeekDispDelegate",
            "PeekCanvasRenderer",
            "PeekCanvasConfig",
            // Unnamed Dependencies
            "angular", "jquery",
            "PeekModelGridDataManager",
            "PeekCanvasBounds",
            "PeekCanvasMouseDelegate",
            "PeekSplashScreenModalMod",
            "PeekPopupMenuModalMod"
        ],
        function (PeekCanvasModel,
                  PeekCanvasMouse,
                  PeekCanvasMouseSelectDelegate,
                  PeekDispRefData,
                  PeekDispDelegate,
                  PeekCanvasRenderer,
                  PeekCanvasConfig) {
// -------------------------- Placeholder Module -----------------------
            var peekModelCanvasMod = angular.module('peekModelCanvasMod', [
                'peekSplashScreenModalMod', 'peekPopupMenuModalMod'
            ]);

            peekModelCanvasMod.controller('PeekCanvasCtrl', [
                '$scope', '$uibModal', function ($scope, $uibModal) {
                    var self = this;
                    self.canvas = null;

                    // The config for the canvas
                    self.config = new PeekCanvasConfig($scope);
                    self.config.controller.uniquFiltId = makeCanvasFiltId();

                    // The model view the viewable items on the canvas
                    self.model = new PeekCanvasModel($scope, self.config, $uibModal);

                    // The display reference data
                    self.dispRefData = new PeekDispRefData($scope, self.config);

                    // The display renderer delegates
                    self.dispDelegate = new PeekDispDelegate($scope, self.config, self.dispRefData);

                    // The user interaction handler.
                    self.mouse = new PeekCanvasMouse($scope, self.config,
                            self.model, self.dispDelegate);

                    // The canvas renderer
                    self.renderer = new PeekCanvasRenderer($scope, self.config,
                            self.model, self.dispDelegate);

                    // Add the mouse class to the renderers draw list
                    self.renderer.drawEvent.add(bind(self.mouse, self.mouse.draw));

                    // The controller is initialise before the directive is linked.
                    // When the directive is linked, we will initialise everything for the canvas.
                    var unregisterInit = $scope.$watch('canvasId', function (canvasId) {
                        // If we've already initilised once, or this is the init run of the watch
                        if (self.canvas != null || canvasId == null)
                            return;

                        self.canvas = getElem(canvasId);
                        if (self.canvas == null)
                            return;

                        self.mouse.setCanvas(self.canvas);
                        self.renderer.setCanvas(self.canvas);
                        self.model.init();

                        // Unregister the watch
                        unregisterInit();
                    });

                    $scope.$watch(function () {
                                try {
                                    return $scope.diagramData.coordSet;
                                } catch (e) {
                                    return null;
                                }
                                // if ($scope.diagramData == null || $scope.diagramData.coordSet == null)
                                //     return null;

                            }, function (coordSet) {
                                self.config.controller.coordSet = coordSet;
                            }
                    );

                    displayCanvasSplashScreen($scope, $uibModal);
                }
            ]);


            function makeCanvasFiltId() {
                var text = "";
                var possible = "abcdefghijklmnopqrstuvwxyz";

                for (var i = 0; i < 10; i++)
                    text += possible.charAt(Math.floor(Math.random() * possible.length));

                return text;
            }

            var nextCanvasId = 0;

            peekModelCanvasMod.directive('peekCanvas', function () {
                return {
                    restrict: 'E',
                    //scope: {},
                    controller: 'PeekCanvasCtrl',
                    controllerAs: 'canvasC',
                    templateUrl: '/view/PeekCanvas.html',
                    link: function ($scope, $elem, attrs) {
                        var id = 'canvas.' + nextCanvasId.toString();
                        nextCanvasId += 1;

                        var jqCanvas = angular.element($elem).find('canvas').attr('id', id);
                        $scope.canvasId = id;

                        $scope.initPan = attrs['pan'];
                        $scope.initZoom = attrs['zoom'];
                        $scope.initFilt = attrs['filt'];

                    }

                };
            });


            peekModelCanvasMod.directive('autoCanvasPanelSize', function () {
                return function ($scope, $element, attrs) {
                    var canvasElement = $(angular.element($element));
                    $("body").css("overflow", "hidden");

                    function delta() {
                        return $(window).height();
                    }

                    function updateHeight(newVal) {
                        canvasElement.css("height", newVal + "px");
                        canvasElement.css("width", "100%");
                    }

                    $scope.$watch(delta, updateHeight);
                };
            });

        }
);