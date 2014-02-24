/* globals angular:false */
define(['constants', 'services/ParanoidScope', 'directives/MediaGroup'], function (constants) {
    "use strict";

    var GalleryModule = angular.module(
        'commissar.directives.Gallery',
        [
            'commissar.directives.MediaGroup',
            'commissar.services.ParanoidScope'
        ]
    );
    
    GalleryModule.controller('commissar.directives.Gallery.controller', function ($scope, ParanoidScope) {
        $scope.name = 'commissar.directives.Gallery.controller';
        
        $scope.setActiveCollection = function (newCollection) {
            ParanoidScope.apply($scope, function () {
                $scope.activeCollection = newCollection;
            });
        };
        
        $scope.setActiveImage = function (newImage) {
            ParanoidScope.apply($scope, function () {
                $scope.activeImage = newImage;
            });
        };
        
        $scope.collectionOpened = function (title, force) {
            
            if (title === undefined) {
                return $scope.activeCollection;
            }
            
            if (force === undefined) {
                return $scope.activeCollection === title;
            }
            
            console.log("opened collection with force");
            console.log(force, title);
            
            if (force) {
                $scope.setActiveCollection(title);
            } else if ($scope.activeCollection === title) {
                $scope.setActiveCollection(null);
            }  
        };
        
        $scope.mediaOpened = function (title, force) {
            
            if (title === undefined) { 
                return $scope.activeImage;
            }
            
            if (force === undefined) {
                return $scope.activeImage === title;
            }
            
            console.log("opened media with force");
            console.log(force, title);
            
            if (force) {
                $scope.setActiveImage(title);
            } else if ($scope.activeImage === title) {
                $scope.setActiveImage(null);
            }
        };
    });

    GalleryModule.directive("gallery", function (/** /$rootScope/**/) {
        var Gallery = {
            priority: 0,
            templateUrl: constants.templatePrefix + 'directives/Gallery.html',
            replace: true,
            transclude: true,
            restrict: 'AE',
            require: [
                'collections'
            ],
            scope: {
                collections: '=',
                activeCollection: '=',
                activeImage: '=',
                allUploads: '=',
                allUploadsTitle: '='
            },
            controller: 'commissar.directives.Gallery.controller'
        };
        return Gallery;
    });

    return GalleryModule;

});