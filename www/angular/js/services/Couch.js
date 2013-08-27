define(['angular', 'CornerCouch'], function (angular) {
    "use strict";
    
    var CouchModule = angular.module('commissar.services.Couch', ['CornerCouch']);
    
    CouchModule.factory('Couch', function ($rootScope, cornercouch, $q) {
        if (!$rootScope.cornercouch) {
            $rootScope.cornercouch = cornercouch("/couchdb", "GET");
        }
        
        function isDefined(value) {
            return typeof value !== 'undefined';
        }
        
        var Couch = {
            databaseExists: function (databaseName) {
                var deferred = $q.defer();
                
                if (isDefined($rootScope.cornercouch.databases)) {
                    deferred.resolve($rootScope.cornercouch.databases.indexOf(databaseName) > -1);
                } else {
                    $rootScope.cornercouch.getDatabases().then(function () {
                        deferred.resolve($rootScope.cornercouch.databases.indexOf(databaseName) > -1);
                    });
                }
                
                return deferred.promise;
            },
            getSession: function () {
                var deferred = $q.defer();
                if (typeof $rootScope.cornercouch.userCtx !== 'undefined') {
                    deferred.resolve($rootScope.cornercouch.userCtx);
                } else {
                    $rootScope.cornercouch.session().then(function (response) {
                        deferred.resolve(response.userCtx);
                    }, function (reason) {
                        deferred.reject(reason);
                    });
                }
                
                return deferred.promise;
            },
            login: function (username, password) {
                var deferred = $q.defer();
                
                $rootScope.cornercouch.login(username, password).then(function () {
                    deferred.resolve(true);
                }, function () {
                    deferred.resolve(false);
                });
                
                return deferred.promise;
            }
        };

        return Couch;
    });
    
    
    return CouchModule;
    
});