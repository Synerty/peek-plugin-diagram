/**
 * Peek Canvas Data
 *
 * This class is responisble for storing all the data required for the canvas.
 * This includes storing referecnes to Model objects, and settings for this canvas
 */

define("PeekCanvasConfig", [
            // Named Dependencies
            "PeekCanvasMouseSelectDelegate"
            // Unnamed Dependencies
        ],
        function (PeekCanvasMouseSelectDelegate) {
            function PeekCanvasConfig($scope) {
                var self = this;
                self._scope = $scope;

                self.controller = {
                    updateInterval: 400,
                    dispUpdateProcessChunkSize: 10000000,
                    uniquFiltId: null,
                    coordSet: null
                };

                self.renderer = {
                    invalidate: false, // Set this to true to cause the renderer to redraw
                    drawInterval: 60,
                    backgroundColor: 'black',
                    selection: {
                        color: 'white',
                        width: 8,
                        lineGap: 6,
                        dashLen: 3,
                        snapSize: 4
                    },
                    grid: {
                        show: false,
                        size: 16,
                        color: '#CCC',
                        font: '12px Arial',
                        lineWidth: 1,
                        snapDashedLen: 2
                    }
                };

                self.canvas = {
                    pan: {
                        x: 238255,
                        y: 124655
                        // x: 303419,
                        // y: 152139
                    },
                    zoom: 0.5,

                    minZoom: 0.01,
                    maxZoom: 10
                };

                self.mouse = {
                    currentDelegateName: PeekCanvasMouseSelectDelegate.NAME,
                    phUpDownZoomFactor: 20.0,
                    currentPosition: {x: 0, y: 0},
                    selecting: {
                        color: '#3399FF',
                        width: 2,
                        lineGap: 2,
                        dashLen: 3,
                        snapSize: 4,
                        margin: 5, // The distance distance that the click can happen from the shape
                    },
                };

                self.model = {
                    gridsWaitingForData: 0,
                    dispOnScreen: 0
                };

                // Debug data
                self.debug = {};

                if ($scope.initZoom != null) {
                    self.canvas.zoom = parseFloat($scope.initZoom);
                }

                self.invalidate = function () {
                    self.renderer.invalidate = true;
                    $scope.$apply();
                };

            }

            return PeekCanvasConfig;
        }
);