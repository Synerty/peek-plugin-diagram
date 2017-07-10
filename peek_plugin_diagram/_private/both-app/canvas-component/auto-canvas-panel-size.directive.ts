/*
peekModelCanvasMod.directive('autoCanvasPanelSize', function () {
    return function ($scope, $element, attrs) {
        var canvasElement = $(angular.element($element));
        $("body").css("overflow", "hidden");

        function delta() {
            return $(window).height();
        }

        function updateHeight(newVal) {
            canvasElement.css("height", newVal + "px");
            canvasElement.css("width", "100%");
        }

        $scope.$watch(delta, updateHeight);
    };
});
*/