define(['angular', 'constants', 'services/Authentication', 'directives/Markdown', 'directives/UploadForm', 'filters/Capitalize'], function (angular, constants) {
    "use strict";
    
    var GalleryCtrlModule = angular.module(
        'commissar.controllers.GalleryCtrl',
        [
            'commissar.services.Authentication',
            'commissar.directives.Markdown',
            'commissar.directives.UploadForm',
            'commissar.filters.Capitalize'
        ]
    );
    
    GalleryCtrlModule.controller('GalleryCtrl', function ($scope) {
        $scope.name = 'GalleryCtrl';
    });

    GalleryCtrlModule.config(function ($routeProvider) {
        $routeProvider.when(
            '/my/gallery',
            {
                templateUrl: constants.templatePrefix + 'gallery/index.html',
                controller: 'GalleryCtrl'
            }
        );
        $routeProvider.when(
            '/my/gallery/upload',
            {
                templateUrl: constants.templatePrefix + 'gallery/upload.html',
                controller: 'GalleryCtrl'
            }
        );
        $routeProvider.when(
            '/:userslug/gallery',
            {
                templateUrl: constants.templatePrefix + 'gallery/index.html',
                controller: 'GalleryCtrl'
            }
        );
    });
    
    return GalleryCtrlModule;
});