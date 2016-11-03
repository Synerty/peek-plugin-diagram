/**
 * Created by peek on 27/05/15.
 */

'use strict';


define( [
            // Named Depencencies
            "AngFormLoadController",
            // Unnamed Dependencies
            "angular"
        ],
        function (AngFormLoadController) {

// -------------------------- Placeholder Module -----------------------
            var peekModelNavbarCoordSetMenuMod = angular.module('peekModelNavbarCoordSetMenuMod', []);

// ------ PlaceholderCtrl
            peekModelNavbarCoordSetMenuMod.controller('PeekModelNavbarCoordSetMenuCtrl', [
                '$scope',
                function ($scope) {
                    var self = this;

                    self.loader = new AngFormLoadController($scope,
                            {key: "c.s.s.p.modelset.list.data"}, {
                                objName: 'modelSets',
                                dataIsArray: true
                            });

                    $scope.coordSetClicked = function (coordSet) {
                        $scope.diagramData.coordSet = coordSet;
                    };

                    $scope.isModelSetSel = function (modelSet) {
                        return false;//ph.id === $scope.headerId && $scope.headerId !== null;
                    };

                    $scope.isCoordSetSel = function (coordSet) {
                        return $scope.diagramData.coordSet != null
                                && coordSet.id === $scope.diagramData.coordSet.id;
                    };

                }]);

// Add custom directive for build-navbar
            peekModelNavbarCoordSetMenuMod.directive('peekModelNavbarCoordSetMenu', function () {
                return {
                    restrict: 'E',
                    templateUrl: '/view/PeekModelNavbarCoordSetMenu.html',
                    replace: true,
                    controller: 'PeekModelNavbarCoordSetMenuCtrl',
                    controllerAs: 'navigationMenuC'
                };
            });

        });