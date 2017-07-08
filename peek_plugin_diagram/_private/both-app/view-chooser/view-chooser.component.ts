import {Component, OnInit} from "@angular/core";

import {
    ComponentLifecycleEventEmitter,
    TupleActionPushService,
    TupleDataObserverService
} from "@synerty/vortexjs";


@Component({
    selector: 'pl-diagram-model-navbar',
    templateUrl: 'view-chooser.component.html',
    styleUrls:['view-chooser.component.css'],
    moduleId: module.id
})
export class NavbarCtrl extends ComponentLifecycleEventEmitter implements OnInit {
    // ------ PeekNavbarCtrl
    constructor($scope, $location) {
        var self = this;

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
        //     this.vortexService.sendFilt({'key': "c.s.p.model.disp.cache_all"});
        // };

        new PayloadEndpoint({'key': "c.s.p.model.disp.cache_all.progress"},
            function (payload) {
                if (payload.result.finished == true) {
                    logSuccess(payload.result.message);

                } else if (payload.result.error == true) {
                    this.balloonMsg.showError(payload.result.message);

                } else {
                    logInfo(payload.result.message);
                }
            }, $scope);

    }
}