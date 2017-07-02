/**
 * Created by peek on 27/05/15.
 */

'use strict';


define([
            // Named Depencencies
            "PayloadEndpoint", "AngFormLoadController",
            // Unnamed Dependencies
            "angular",
            "peek_plugin_diagram/_private/both-app/navbar/PeekModelNavbarCoordSetMenuMod",
            "peek_plugin_diagram/_private/both-app/navbar/PeekModelNavbarLayerMenuMod"
        ],
        function (PayloadEndpoint, AngFormLoadController) {



            // -------------------------- Placeholder Module -----------------------
            var peekModelNavbarMod = angular.module('peekModelNavbarMod',
                    ['peekModelNavbarLayerMenuMod', 'peekModelNavbarCoordSetMenuMod']);

            // ------ PeekNavbarCtrl
            peekModelNavbarMod.controller('PeekModelNavbarCtrl', [
                '$scope',
                '$location',
                function ($scope, $location) {
                    var self = this;
                    var scope = $scope;

                    $scope.thing = $location.absUrl();

                    new AngFormLoadController($scope,
                            {key: "peekadm.navbar.data"}, {
                                objName: "navData"
                            }
                    );

                    $scope.isLicensed = function () {
                        return scope.navData && !scope.navData.demoExceeded;
                    };

                    $scope.isNotLicensed = function () {
                        return scope.navData && scope.navData.demoExceeded;
                    };

                    $scope.wereAt = function (path) {
                        if (path == '/')
                            return $location.path() == '/';

                        return $location.absUrl().endsWith(path)
                                || $location.path().startsWith(path);
                    };

                    // self.cacheAll = function () {
                    //     vortexSendFilt({'key': "c.s.p.model.disp.cache_all"});
                    // };

                    new PayloadEndpoint({'key': "c.s.p.model.disp.cache_all.progress"},
                            function (payload) {
                                if (payload.result.finished == true) {
                                    logSuccess(payload.result.message);

                                } else if (payload.result.error == true) {
                                    logError(payload.result.message);

                                } else {
                                    logInfo(payload.result.message);
                                }
                            }, $scope);

                }]);

            // Add custom directive for build-navbar
            peekModelNavbarMod.directive('peekModelNavbar', function () {
                return {
                    restrict: 'E',
                    templateUrl: '/view/PeekModelNavbar.html'
                };
            });

        }
);