/* globals angular:false */
define(
    [
        'constants',
        'directives/UploadForm',
        'directives/MediaGroup',
        'directives/Gallery',
        'services/ImageManager',
        'services/ParanoidScope',
        'filters/NotThumbnail'
    ], function (constants) {
    "use strict";
    
    var GalleryCtrlModule = angular.module(
        'commissar.controllers.GalleryCtrl',
        [
            'commissar.directives.UploadForm',
            'commissar.directives.MediaGroup',
            'commissar.directives.Gallery',
            'commissar.services.ImageManager',
            'commissar.services.ParanoidScope',
            'commissar.filters.NotThumbnail'
        ]
    );
    
    GalleryCtrlModule.controller('GalleryCtrl', function ($scope, ImageManager, ParanoidScope, $routeParams, $location) {
        $scope.name = 'GalleryCtrl';
        
        $scope.collections = {};
        
        $scope.activeCollection = $routeParams.collection;
        $scope.activeImage = $routeParams.image;
        
        $scope.$watch("activeCollection", function () {
            if ($scope.activeCollection) {
                $location.path("/my/gallery/" + $scope.activeCollection);
            } else {
                $location.path("/my/gallery");
            }
        });
        
        $scope.$watch("activeImage", function () {
            if ($scope.activeImage && $scope.activeCollection) {
                $location.path("/my/gallery/" + $scope.activeCollection + "/" + $scope.activeImage); 
           } else if ($scope.activeCollection) {
                $location.path("/my/gallery/" + $scope.activeCollection);
            } else {
                $location.path("/my/gallery");
            }
        });
        
        ImageManager.getMyImages().then(function (data) {
            ParanoidScope.apply($scope, function () {
                $scope.collections["All Uploads"] = data;
            });
        });
    });

    GalleryCtrlModule.config(function ($routeProvider) {
        var options = {
            templateUrl: constants.templatePrefix + 'gallery/index.html',
            controller: 'GalleryCtrl'
        };
        var routes = [
            '/my/gallery',
            '/my/gallery/:collection',
            '/my/gallery/:collection/:image',
            '/:userslug/gallery',
            '/:userslug/gallery/:collection',
            '/:userslug/gallery/:collection/:image'
        ];
        for (var i = 0; i < routes.length; i++) {
            $routeProvider.when(
                routes[i],
                options
            );
        }
        $routeProvider.when(
            '/my/gallery/upload',
            {
                templateUrl: constants.templatePrefix + 'gallery/upload.html',
                controller: 'GalleryCtrl'
            }
        );
    });
    
    return GalleryCtrlModule;
});
