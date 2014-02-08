/* globals angular:false */
define(['constants', 'services/Authentication', 'services/ParanoidScope', 'services/ImageManager', 'filters/NotThumbnail', 'moment', 'angular-moment'], function (constants) {
    "use strict";

    var MediaModule = angular.module(
        'commissar.directives.Media',
        [
            'commissar.services.Authentication',
            'commissar.services.ParanoidScope',
            'commissar.services.ImageManager',
            'commissar.filters.NotThumbnail',
            'angularMoment'
        ]
    );
    
    MediaModule.controller('commissar.directives.Media.controller', function ($scope, NotThumbnailFilter, $element, ParanoidScope, ImageManager) {
        $scope.controllerName = 'commissar.directives.Media.controller';
        
        $scope.name = $scope.document.title;
        
        $scope.editableDocument = angular.copy($scope.document);

        $scope.className = function () {
            var mediaType = $scope.document.mediaType;
            if (constants.allowedMediaTypes.indexOf(mediaType) < 0) {
                mediaType = "";
            }
            var mode = $scope.mode();
            return 'mmedia mmedia-' + mediaType + ' mmedia-' + mode + ' mmedia-' + mode + '-' + mediaType;
        };

        $scope.thumbnail = function (type) {
            var possibles = [];
            angular.forEach(NotThumbnailFilter($scope.document._attachments), function (value, key) {
                possibles.push(key);
            });
            return '/node/thumbnail/' + type + '/commissar_user_' + $scope.document.author + '/' + $scope.document._id + '/' + possibles[0];
        };
        
        $scope.isOpened = function () {
            return $scope.mediaOpened($scope.name);
        };
        
        $scope.open = function () {
            console.log("open", $scope.name);
            if (!$scope.isOpened()) {
                $scope.mediaOpened($scope.name, true);
            }
        };
        
        $scope.close = function () {
            console.log("close");
            if ($scope.isOpened()) {
                $scope.mediaOpened($scope.name, false);
            }
        };
        
        $scope.mode = function () {
            return $scope.parentMode;
        };
        
        $scope.isMode = function (input) {
            return $scope.mode === input;
        };
        
        $scope.edit = function () {
            ParanoidScope.apply($scope, function () {
                $scope.editing = true;
            });
        };
        
        $scope.save = function () {
            ParanoidScope.apply($scope, function () {
                ImageManager.save($scope.editableDocument).then(function () {
                    $scope.editing = false;
                    $scope.open($scope.editableDocument.title, true);
                }, function (err) {
                    alert("Couldn't save! " + err);
                });
            });
        };
    });

    MediaModule.directive("media", function (/** /$rootScope/**/) {
        var Media = {
            priority: 0,
            templateUrl: constants.templatePrefix + 'directives/Media.html',
            replace: true,
            transclude: true,
            restrict: 'AE',
            require: 'document',
            scope: {
                document: '=',
                visible: '=',
                parentMode: '@mode',
                mediaOpened: '='
            },
            controller: 'commissar.directives.Media.controller'
        };
        return Media;
    });

    return MediaModule;

});
