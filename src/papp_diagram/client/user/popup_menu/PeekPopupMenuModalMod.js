/**
 * Created by peek on 27/05/15.
 */

'use strict';

var URL_GET_COMMAND_ONLY = 1;
var URL_POST_COMMAND_ONLY = 2;
var URL_OPEN_NEW_TAB = 3;
var URL_OPEN_IN_FRAME = 4;

function displayCanvasPopupMenu($scope, $uibModal, dispAction) {
    // Popup loading screen
    var scope = $scope.$new(true);
    scope.dispAction = dispAction;

    $uibModal.open({
        templateUrl: '/view/PeekPopupMenuModal.html',
        controller: 'PeekPopupMenuModalCtrl',
        controllerAs: 'menuCtrl',
        scope: scope, // Create with new isolated scope
        size: 'sm'
    });
}

define("PeekPopupMenuModalMod", [
            // Named Dependencies
            "AngFormLoadController",
            // Unnamed Dependencies
            "angular-bootstrap"
        ],
        function (AngFormLoadController, gridDataManager) {
// -------------------------- Begin Module -----------------------
            var peekPopupMenuModalMod = angular.module('peekPopupMenuModalMod', []);

            peekPopupMenuModalMod.controller('PeekPopupMenuModalCtrl', [
                '$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                    var self = this;

                    $scope.actionData = $scope.dispAction.d;

                    var ad = $scope.actionData;

                    // BUG, Remove double quotes from menu names,
                    // this should/will be fixed in the agent eventually
                    ad.data1 = ad.data1.replace(/^'/, '');
                    ad.data1 = ad.data1.replace(/'$/, '');

                    self.loader = new AngFormLoadController($scope,
                            {key: "peek.model.disp_action.popup_menu"}, {
                                objName: "menuItems",
                                dataIsArray: true,
                                loadOnInit: false
                            }
                    );
                    self.loader.load({actionData: $scope.actionData}, false);

                    self.close = function () {
                        $uibModalInstance.close();
                    };


                    self.itemUrl = function (menuItem) {
                        if (menuItem.urlType == URL_OPEN_NEW_TAB) {
                            return menuItem.url;
                        }
                        return '#';
                    };

                    self.itemClicked = function (menuItem) {
                        if (menuItem.urlType == URL_GET_COMMAND_ONLY
                                || menuItem.urlType == URL_POST_COMMAND_ONLY) {

                            var type = menuItem.urlType == URL_GET_COMMAND_ONLY
                                    ? 'get' : 'post';

                            $.ajax({
                                type: type,
                                cache: false,
                                url: menuItem.url,
                                dataType: "text",
                                error: function (xhr, status, error) {
                                    if (xhr.responseText == null) {
                                        logError("Command failed : Could not connect to "
                                                + menuItem.url);
                                    } else {
                                        logError("Command failed : "
                                                // + xhr.status + '\n'
                                                + xhr.responseText);
                                    }
                                },
                                success: function () {
                                    logInfo("Command Sent Successfully");
                                }
                            });

                            return;
                        }

                        if (menuItem.urlType == URL_OPEN_NEW_TAB) {
                            var win = window.open(menuItem.url, '_blank');
                            win.focus();
                            return;
                        }

                        if (menuItem.urlType == URL_OPEN_IN_FRAME) {
                            logError("Frame style menu item not implemented");
                            return;
                        }

                        logError("Unhandled menu option type");

                    }
                }
            ]);


        }
);