'use strict';

requirejs(["angular", "jquery"], function () {
// -------------------------- Placeholder Module -----------------------
    var peekDxfViewerInspector = angular.module('peekDxfViewerInspector', []);


    // ------ peekDxfViewerInspectorCtrl
    peekDxfViewerInspector.controller('peekDxfViewerInspectorCtrl', [
        '$scope',
        function ($scope) {
            var self = this;

            $scope.isNode = function (r) {
                return r != null && r.nodeId != null;
            };

            $scope.hasProps = function (r) {
                var node = $scope.getNode(r);
                return node != null && node.props != null;
            };

            $scope.isConn = function (r) {
                return r != null && r.connId != null;
            };

            $scope.getConn = function (r) {
                return networkModel.conductors[r.connId];
            };

            $scope.getNode = function (r) {
                return networkModel.nodes[r.nodeId];
            };

            $scope.getProps = function (r) {
                var node = $scope.getNode(r);
                if (!node)
                    return null;

                return node.props;
            };

            $scope.isPoly = function (r) {
                return r != null && r.type === 2;
            };

        }]);

});