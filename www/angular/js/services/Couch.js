define(['angular', 'CornerCouch'], function (angular) {
    "use strict";
    
    var CouchModule = angular.module('commissar.services.Couch', ['CornerCouch']);
    
    CouchModule.factory('Couch', function ($rootScope, cornercouch) {
        if (!$rootScope.cornercouch) {
            $rootScope.cornercouch = cornercouch("/couchdb", "GET");
            $rootScope.cornercouch.getDatabases();
        }
        
        var Couch = {
            databaseExists: function (databaseName) {
                return ($rootScope.cornercouch.databases.indexOf(databaseName) > -1);
            }
        };

        return Couch;
    });
    
    
    return CouchModule;
    
});