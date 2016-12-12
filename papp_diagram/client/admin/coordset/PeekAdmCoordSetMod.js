/// <amd-dependency path="angular"/>
'use strict';

define([
            // Named Depencencies
            "AngFormLoadController",
            // Unnamed Dependencies
            "angular", "jquery"
        ], function (AngFormLoadController) {
// -------------------------- CoordSet Module -----------------------
            var peekAdmCoordSetMod = angular.module('peekAdmCoordSetMod', []);


// ------ PeekCoordSetCtrl
            peekAdmCoordSetMod.controller('PeekAdmCoordSetCtrl', [
                '$scope',
                '$location',
                function ($scope, $location) {
                    var self = this;


                }]);

// ------------- The list controller for this page
            peekAdmCoordSetMod.controller('PeekAdmCoordSetListCtrl', [
                '$scope',
                function ($scope) {
                    var self = this;

                    self.loader = new AngFormLoadController($scope,
                            {key: "peakadm.coordset.list.data"}, {
                                objName: 'coordSetList',
                                dataIsArray: true,
                                actionPostfix: 'CoordSets'
                            });


                }]);

// Add custom directive for peek_server-execute-list
            peekAdmCoordSetMod.directive('peekAdmCoordSetList', function () {
                return {
                    restrict: 'E',
                    templateUrl: '/view/PeekAdmCoordSetList.html'
                };
            });


        }
);