/**
 * Created by peek on 27/05/15.
 */

'use strict';


function displayCanvasSplashScreen($scope, $uibModal) {
    // Popup loading screen
    $uibModal.open({
        templateUrl: '/view/PeekSplashScreenLoadingModal.html',
        controller: 'PeekSplashScreenModalCtrl',
        controllerAs: 'loadCtrl',
        backdrop: 'static', // Don't close by clicking out of the modal
        keyboard: false, // Don't close with escape key
        scope: $scope.$new(true), // Create with new isolated scope
        size: 'lg'
    });
}

define("PeekSplashScreenModalMod", [
            // Named Dependencies
            "AngFormLoadController",
            "PeekModelGridDataManager",
            // Unnamed Dependencies
            "angular-bootstrap"
        ],
        function (AngFormLoadController, gridDataManager) {
// -------------------------- Begin Module -----------------------
            var peekSplashScreenModalMod = angular.module('peekSplashScreenModalMod', []);

            peekSplashScreenModalMod.controller('PeekSplashScreenModalCtrl', [
                '$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                    var self = this;

                    self._loadDate = new Date();

                    new AngFormLoadController($scope,
                            {key: "peekadm.navbar.data"}, {
                                objName: "licData"
                            }
                    );


                    // The controller is initialise before the directive is linked.
                    // When the directive is linked, we will initialise everything for the canvas.
                    var unregisterInit = $scope.$watch(
                            function () {
                                return gridDataManager.isReady() && $scope.licData != null;
                            },
                            function (isReady) {
                                if (!isReady)
                                    return;

                                var waitRemaining = 5000 - (new Date() - self._loadDate);
                                setTimeout(function () {
                                            $uibModalInstance.close();
                                        },
                                        waitRemaining
                                );

                                // Unregister the watch
                                unregisterInit();
                            }
                    );
                }
            ]);


        }
);