/* globals angular:false */
define(['constants', 'services/ParanoidScope', 'directives/Media'], function (constants) {
    "use strict";

    var MediaGroupModule = angular.module(
        'commissar.directives.MediaGroup',
        [
            'commissar.directives.Media',
            'commissar.services.ParanoidScope'
        ]
    );
    
    MediaGroupModule.controller('commissar.directives.MediaGroup.controller', function ($scope, $element, ParanoidScope) {
        $scope.controllerName = 'commissar.directives.MediaGroup.controller';

        $scope.mousemove = function (event) {
            ParanoidScope.apply($scope, function () {
                $scope.active = Math.floor(event.offsetX / 200 * $scope.documents.length);
                if ($scope.active > $scope.documents.length - 1) {
                    $scope.active = $scope.documents.length - 1;
                }
                if ($scope.active < 0) {
                    $scope.active = 0;
                }
            });
        };

        $scope.active=0;

        $scope.isActive = function ($index) {
            return $scope.active === $index;
        };
        
        $scope.isOpened = function () {
            var isOpened = $scope.collectionOpened($scope.name);
            console.log("isOpened", isOpened, $scope.name);
            return isOpened;
        };
        
        $scope.open = function () {
            console.log("open");
            if (!$scope.isOpened()) {
                $scope.collectionOpened($scope.name, true);
            }
        };
        
        $scope.close = function () {
            console.log("close");
            if ($scope.isOpened()) {
                $scope.collectionOpened($scope.name, false);
            }
        };
        
        $scope.zoomedDocument = function () {
            var result = null;
            
            angular.forEach($scope.documents, function (el) {
                var document = el.value;
                console.log(document.title);
                if ($scope.mediaOpened(document.title)) {
                    console.log("DOCUMENT FOUND");
                    result = document;
                }
            });
            
            return result;
        };
        
        $scope.mode = function () {
            if ($scope.isOpened()) {
                if ($scope.zoomedDocument()) {
                    return "zoomed";
                }
                return "open";
            }
            return "closed";
        };
        
        $scope.visible = function () {
            return !$scope.collectionOpened() || $scope.isOpened();
        };
    });

    MediaGroupModule.directive("mediagroup", function (/** /$rootScope/**/) {
        var MediaGroup = {
            priority: 0,
            templateUrl: constants.templatePrefix + 'directives/MediaGroup.html',
            replace: true,
            transclude: true,
            restrict: 'AE',
            require: [
                'documents',
                'wark'
            ],
            scope: {
                documents: '=documents',
                name: '=',
                collectionOpened: '=',
                mediaOpened: '='
            },
            controller: 'commissar.directives.MediaGroup.controller'
        };
        return MediaGroup;
    });

    return MediaGroupModule;

});
