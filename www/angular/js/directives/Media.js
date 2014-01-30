/* globals angular:false */
define(['constants', 'services/Authentication', 'services/ParanoidScope', 'filters/NotThumbnail', 'moment', 'angular-moment'], function (constants) {
    "use strict";

    var MediaModule = angular.module(
        'commissar.directives.Media',
        [
            'commissar.services.Authentication',
            'commissar.services.ParanoidScope',
            'commissar.filters.NotThumbnail',
            'angularMoment'
        ]
    );
    
    MediaModule.controller('commissar.directives.Media.controller', function ($scope, NotThumbnailFilter, $element) {
        $scope.name = 'commissar.directives.Media.controller';

        $scope.className = function () {
            var mediaType = $scope.document.mediaType;
            if (constants.allowedMediaTypes.indexOf(mediaType) < 0) {
                mediaType = "";
                console.log("DIRTY!");
            }
            return 'mmedia mmedia-' + mediaType + ' mmedia-' + $scope.mode + ' mmedia-' + $scope.mode + '-' + mediaType;
        };

        $scope.thumbnail = function () {
            var possibles = [];
            angular.forEach(NotThumbnailFilter($scope.document._attachments), function (value, key) {
                possibles.push(key);
            });
            return '/node/thumbnail/thumb-small/commissar_user_' + $scope.document.author + '/' + $scope.document._id + '/' + possibles[0];
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
                mode: '@'
            },
            controller: 'commissar.directives.Media.controller'
        };
        return Media;
    });

    return MediaModule;

});
