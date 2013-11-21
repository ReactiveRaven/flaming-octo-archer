define(['angular', 'constants', 'directives/UploadForm', 'services/ImageManager'], function (angular, constants) {
    "use strict";
    
    var GalleryCtrlModule = angular.module(
        'commissar.controllers.GalleryCtrl',
        [
            'commissar.directives.UploadForm',
            'commissar.service.ImageManager'
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