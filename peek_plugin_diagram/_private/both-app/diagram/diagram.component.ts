import {Component, ViewChild, Input} from "@angular/core";

import {PeekCanvasConfig} from "../canvas/PeekCanvasConfig";
export function makeCanvasFiltId() {
    let text = "";
    let possible = "abcdefghijklmnopqrstuvwxyz";

    for (let i = 0; i < 10; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


@Component({
    selector: 'pl-diagram-canvas',
    templateUrl: 'diagram.component.html',
    styleUrls:['diagram.component.css'],
    moduleId: module.id
})
export class PeekCanvasCtrl {
    // https://stackoverflow.com/questions/32693061/angular-2-typescript-get-hold-of-an-element-in-the-template
    @ViewChild('canvas') canvas;

    @Input("modelId") modelId:number;
    @Input("viewId") viewId:number;


    constructor($scope, $uibModal) {
        let id = 'canvas.' + nextCanvasId.toString();
        nextCanvasId += 1;

        let jqCanvas = angular.element($elem).find('canvas').attr('id', id);
        $scope.canvasId = id;

        $scope.initPan = attrs['pan'];
        $scope.initZoom = attrs['zoom'];
        $scope.initFilt = attrs['filt'];

        this.canvas = null;

        // The config for the canvas
        this.config = new PeekCanvasConfig($scope);
        this.config.controller.uniquFiltId = makeCanvasFiltId();

        // The model view the viewable items on the canvas
        this.model = new PeekCanvasModel($scope, this.config, $uibModal);

        // The display reference data
        this.dispRefData = new PeekDispRefData($scope, this.config);

        // The display renderer delegates
        this.dispDelegate = new PeekDispRenderFactory($scope, this.config, this.dispRefData);

        // The user interaction handler.
        this.mouse = new PeekCanvasInput($scope, this.config,
            this.model, this.dispDelegate);

        // The canvas renderer
        this.renderer = new PeekCanvasRenderer($scope, this.config,
            this.model, this.dispDelegate);

        // Add the mouse class to the renderers draw list
        this.renderer.drawEvent.add(bind(this.mouse, this.mouse.draw));

        // The controller is initialise before the directive is linked.
        // When the directive is linked, we will initialise everything for the canvas.
        let unregisterInit = $scope.$watch('canvasId', function (canvasId) {
            // If we've already initilised once, or this is the init run of the watch
            if (this.canvas != null || canvasId == null)
                return;

            this.canvas = getElem(canvasId);
            if (this.canvas == null)
                return;

            this.mouse.setCanvas(this.canvas);
            this.renderer.setCanvas(this.canvas);
            this.model.init();

            // Unregister the watch
            unregisterInit();
        });

        $scope.$watch(function () {
                try {
                    return $scope.diagramData.coordSet;
                } catch (e) {
                    return null;
                }
                // if ($scope.diagramData == null || $scope.diagramData.coordSet == null)
                //     return null;

            }, function (coordSet) {
                this.config.controller.coordSet = coordSet;
            }
        );

        displayCanvasSplashScreen($scope, $uibModal);
    }
}