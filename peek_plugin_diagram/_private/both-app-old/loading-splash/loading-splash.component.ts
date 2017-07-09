import {Component, OnInit} from "@angular/core";

import {
    ComponentLifecycleEventEmitter,
    TupleActionPushService,
    TupleDataObserverService
} from "@synerty/vortexjs";


@Component({
    selector: 'pl-diagram-loading-splash-screen',
    templateUrl: 'loading-splash.component.html',
    moduleId: module.id
})
export class LoadingSplashComponent extends ComponentLifecycleEventEmitter implements OnInit {

    _loadDate: Date;

    constructor(private actionService: TupleActionPushService,
                private tupleDataObserver: TupleDataObserverService,
                private $uibModalInstance,
                gridDataManager) {
        super();
    }

    ngOnInit() {

        this._loadDate = new Date();

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
}