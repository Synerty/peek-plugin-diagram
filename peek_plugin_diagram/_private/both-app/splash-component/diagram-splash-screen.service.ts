import {Injectable} from "@angular/core";

@Injectable
export class DisplayCanvasSplashScreen {
    constructor(private $uibModal) {
    }

    show() {
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
}
