/**
 * Created by peek on 27/05/15.
 */

'use strict';


define([
            // Named Depencencies
            "AngFormLoadController",
            "GridDataManager",
            // Unnamed Dependencies
            "angular"
        ],
        function (AngFormLoadController, peekModelGridDataManager) {

// -------------------------- Placeholder Module -----------------------
            var peekModelNavbarLayerMenuMod = angular.module('peekModelNavbarLayerMenuMod', []);

// ------ PlaceholderCtrl
            peekModelNavbarLayerMenuMod.controller('NavbarLayerMenuCtrl', [
                '$scope',
                function ($scope) {
                    var self = this;

                    $scope.$watch(function () {
                                return peekModelGridDataManager.isReady()
                            },
                            function () {
                                $scope.layers = peekModelGridDataManager.layersOrderedByOrder();
                            });

                    $scope.isVisible = function (layer) {
                        return layer.visible;
                    };

                    $scope.layerClicked = function (layer) {
                        layer.visible = !layer.visible;
                    };

                }]);

            // Add custom directive for build-navbar
            peekModelNavbarLayerMenuMod.directive('peekModelNavbarLayerMenu', function () {
                return {
                    restrict: 'E',
                    templateUrl: '/view/NavbarLayerMenu.html',
                    replace: true,
                    controller: 'NavbarLayerMenuCtrl',
                    controllerAs: 'layerMenuC'
                };
            });

        }
);