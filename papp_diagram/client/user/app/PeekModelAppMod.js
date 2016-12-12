/**
 * Created by peek on 27/05/15.
 */




define([
            // Main app requirements
            "angular", "jquery", "bootstrap",
            // RapUI
            "Vortex",
            // Add in angular components
            "angular-route", "angular-bootstrap", "angular-dragdrop",
            // Model viewer requirements
            "PeekModelDashboardMod", "PeekModelNavbarMod",
            "PeekCanvasMod"
        ],
        function () {

            var peekModelAppCtrlMod = angular.module('peekModelAppCtrlMod',
                    ['ui.bootstrap.modal', "ngRoute"]);

            var peekModelApp = angular.module('peekModelApp', ['rapuiMod', 'ngRoute',
                'ui.bootstrap',
                'peekModelAppCtrlMod', 'peekModelNavbarMod',
                'peekModelDashboardMod', 'peekModelCanvasMod']);

            // --------------------- Angular Application----------------------------

            $(function () {
                // Bind angular to the document, the ng-app directive
                angular.bootstrap(document, ["peekModelApp"]);
            });

            // --------------------- Angular Application----------------------------

            var configDashboardPath = '/';
            // var configDiagramPath = '/diagram';

            peekModelApp.run(function ($rootScope) {
                $rootScope.configDashboardPath = configDashboardPath;
                // $rootScope.configDiagramPath = configDiagramPath;
            });

            var dashboardRoute = {
                templateUrl: '/view/PeekModelDashboard.html',
                controller: 'PeekDashboardCtrl',
                controllerAs: 'pageCtrl',
                caseInsensitiveMatch: true
            };

            peekModelApp.config(['$routeProvider','$locationProvider',
                function ($routeProvider, $locationProvider) {
                    $locationProvider.html5Mode(true);

                    $routeProvider
                            .when(configDashboardPath, dashboardRoute)
                            .otherwise({
                                redirectTo: function () {
                                    $route.reload();
                                }
                            })
                    ;

                }]);

            peekModelAppCtrlMod.controller('PeekModelAppCtrl',
                    ['$scope', '$route', '$routeParams', '$location', '$uibModal',
                        function ($scope, $route, $routeParams, $location, $uibModal) {
                            $scope.diagramData = {
                                coordSet: null
                            };

                        }]);

        }
);
