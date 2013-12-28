/* globals angular:false */
define(['constants', 'services/Authentication', 'services/ParanoidScope'], function (constants) {
    "use strict";

    var MediaModule = angular.module(
        'commissar.directives.Media',
        [
            'commissar.services.Authentication',
            'commissar.services.ParanoidScope'
        ]
    );
    
    MediaModule.controller('commissar.directives.Media.controller', function ($scope) {
        $scope.name = 'commissar.directives.Media.controller';
        
        $scope.className = function () {
            var mediaType = $scope.document.mediaType;
            if (constants.allowedMediaTypes.indexOf(mediaType) < 0) {
                mediaType = "";
            }
            return 'media ' + mediaType;
        };
    });

    MediaModule.directive("media", function (/** /$rootScope/**/) {
        var Media = {
            priority: 0,
            templateUrl: constants.templatePrefix + 'directives/Media.html',
            replace: true,
            transclude: true,
            restrict: 'AE',
            scope: {},
            controller: 'commissar.directives.Media.controller'
        };
        return Media;
    });

    return MediaModule;

});