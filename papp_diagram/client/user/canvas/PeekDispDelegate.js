define("PeekDispDelegate", [
            // Named Dependencies
            "PeekDispDelegateAction",
            "PeekDispDelegateEllipse",
            "PeekDispDelegateGroupPtr",
            "PeekDispDelegatePoly",
            "PeekDispDelegateText",
            "PeekCanvasBounds"
            // Unnamed Dependencies

        ],
        function (PeekDispDelegateAction,
                  PeekDispDelegateEllipse,
                  PeekDispDelegateGroupPtr,
                  PeekDispDelegatePoly,
                  PeekDispDelegateText,
                  PeekCanvasBounds) {

            // ============================================================================
            // PeekDispDelegate
            // ============================================================================
            function PeekDispDelegate($scope, config, refData) {
                var self = this;

                // self._scope = $scope;
                // self._config = config;
                // self._refData = refData;

                var polyDelegate = new PeekDispDelegatePoly($scope, config, refData);
                var textDelegate = new PeekDispDelegateText($scope, config, refData);
                var ellipseDelegate = new PeekDispDelegateEllipse($scope, config, refData);
                var actionDelegate = new PeekDispDelegateAction($scope, config, refData);
                var groupPtrDelegate = new PeekDispDelegateGroupPtr($scope, config, refData);

                self._delegatesByType = {
                    'DT': textDelegate,
                    'DPG': polyDelegate,
                    'DPL': polyDelegate,
                    'DE': ellipseDelegate,
                    'DA': actionDelegate,
                    'DGP': groupPtrDelegate
                };

                // Used by DispDelegateGroupPtr to draw other items
                $scope.peekDispDelegate = $scope;

            }


            PeekDispDelegate.prototype._initBounds = function (dispObj) {
                if (dispObj.bounds == null) {
                    dispObj.bounds = PeekCanvasBounds.fromGeom(dispObj.g);
                }
            };


            PeekDispDelegate.prototype.draw = function (dispObj, ctx, zoom, pan) {
                var self = this;
                if (self._delegatesByType[dispObj._tt] == null)
                    console.log(dispObj._tt);
                self._delegatesByType[dispObj._tt].draw(dispObj, ctx, zoom, pan);
            };

            PeekDispDelegate.prototype.drawSelected = function (dispObj, ctx, zoom, pan) {
                var self = this;
                self._delegatesByType[dispObj._tt].drawSelected(dispObj, ctx, zoom, pan);
            };

            PeekDispDelegate.prototype.contains = function (dispObj, x, y, margin) {
                var self = this;
                self._initBounds(dispObj);
                return self._delegatesByType[dispObj._tt].contains(dispObj, x, y, margin);
            };

            PeekDispDelegate.prototype.withIn = function (dispObj, x, y, w, h) {
                var self = this;
                self._initBounds(dispObj);
                return self._delegatesByType[dispObj._tt].withIn(dispObj, x, y, w, h);
            };

            PeekDispDelegate.prototype.similarTo = function (dispObj, otherDispObj) {
                return false;
            };

            PeekDispDelegate.prototype.handles = function (dispObj) {
                var self = this;
                return self._delegatesByType[dispObj._tt].handles(dispObj);
            };

            PeekDispDelegate.prototype.deltaMove = function (dispObj, dx, dy) {
                var self = this;
                self._initBounds(dispObj);
                return self._delegatesByType[dispObj._tt].deltaMove(dx, dy);
            };

            PeekDispDelegate.prototype.area = function (dispObj) {
                var self = this;
                self._initBounds(dispObj);
                return self._delegatesByType[dispObj._tt].area(dispObj);
            };

            PeekDispDelegate.prototype.selectionPriotity = function (dispObj1, dispObj2) {
                var self = this;
                if (dispObj1._tt == 'DA' && dispObj2._tt != 'DA')
                    return -1;

                if (dispObj1._tt != 'DA' && dispObj2._tt == 'DA')
                    return 1;

                return dispObj2.bounds.area() - dispObj1.bounds.area();
            };
            return PeekDispDelegate;
        }
);