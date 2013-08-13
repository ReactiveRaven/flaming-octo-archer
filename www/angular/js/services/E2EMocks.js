define(['angular', 'angularMocks', 'angularCookies'], function (angular) {
    'use strict';
    
    var E2EMocksModule = angular.module('commissar.services.E2EMocks', ['ngMockE2E']);
    
    E2EMocksModule.factory('E2EMocks', function ($httpBackend) {
        $httpBackend.whenGET('/couchdb/_all_dbs').respond(200, ['_replicator', '_users', 'commissar', 'commissar_user_fish', 'commissar_user_geraldine', 'commissar_validation_global', 'commissar_validation_users']);
        $httpBackend.whenGET(/templates/).passThrough();
        $httpBackend.whenGET(/.*/).respond(404, "NOT SET UP IN E2EMOCKS YET");
        
        console.log("INJECTED");
    });
    
    return E2EMocksModule;
    
});