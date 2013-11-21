define(['angular', './Authentication', './Couch'], function (angular) {
    "use strict";
    
    var ImageManagerModule = angular.module(
        'commissar.service.ImageManager',
        [
            'commissar.services.Authentication',
            'commissar.services.Couch'
        ]
    );
    
    ImageManagerModule.factory('ImageManager', function (Authentication, Couch, $q, $http) {
            
        var ImageManager = {};
        ImageManager.getMyImages = function () {
            var deferred = $q.defer();
            
            Authentication.getUsername(function (username) {
                $http.get('/couchdb/' + Authentication.getDatabaseName(username) + '/_design/validation_user_media/_view/all');
            }, deferred.reject);
            
            return deferred.promise;
        };

        return ImageManager;
    });
    
    return ImageManagerModule;
    
});