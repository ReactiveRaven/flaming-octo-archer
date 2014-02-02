/* globals angular:false */
define(['./Authentication', './Couch'], function () {
    "use strict";
    
    var ImageManagerModule = angular.module(
        'commissar.services.ImageManager',
        [
            'commissar.services.Authentication',
            'commissar.services.Couch'
        ]
    );
    
    ImageManagerModule.factory('ImageManager', function (Authentication, Couch, $q, $http) {
            
        var ImageManager = {};
        ImageManager.getMyImages = function () {
            var deferred = $q.defer();
            
            Authentication.getUsername().then(function (username) {
                $http.get('/couchdb/' + Authentication.getDatabaseName(username) + '/_design/validation_user_media/_view/all?descending=true').success(function (data) {
                    deferred.resolve(data["rows"]);
                }).error(deferred.reject);
            }, deferred.reject);
            
            return deferred.promise;
        };

        return ImageManager;
    });
    
    return ImageManagerModule;
    
});