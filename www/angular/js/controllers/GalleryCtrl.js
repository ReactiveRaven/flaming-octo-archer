define(['angular', 'constants', 'directives/UploadForm', 'services/ImageManager', 'services/ParanoidScope'], function (angular, constants) {
    "use strict";
    
    var GalleryCtrlModule = angular.module(
        'commissar.controllers.GalleryCtrl',
        [
            'commissar.directives.UploadForm',
            'commissar.services.ImageManager',
            'commissar.services.ParanoidScope'
        ]
    );
    
    GalleryCtrlModule.controller('GalleryCtrl', function ($scope, ImageManager, ParanoidScope) {
        $scope.name = 'GalleryCtrl';
        
        ImageManager.getMyImages().then(function (data) {
            ParanoidScope.apply($scope, function () {
                $scope.images = data;
            });
        });
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