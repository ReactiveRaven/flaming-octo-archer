/* globals angular:false */
define(['../constants'], function (constants) {
    "use strict";
    
    var AdminCtrlModule = angular.module(
        'commissar.controllers.AdminCtrl',
        ['commissar.services.Authentication', 'commissar.directives.Markdown', 'commissar.filters.Capitalize']
    );
    
    AdminCtrlModule.controller('AdminCtrl', ['$scope', 'Couch', function ($scope, Couch) {
        $scope.name = 'AdminCtrl';
        
        $scope.pushDesignDocs = function () {
            $scope.pushingDesignDocs = true;
            $scope.pushDesignDocsErrors  = false;
            Couch.pushDesignDocs().then(function () {
                $scope.pushingDesignDocs = false;
            }, function (error) {
                $scope.pushingDesignDocs = false;
                $scope.pushDesignDocsErrors = error;
            });
        };
        
        $scope.pushingDesignDocs = false;
        $scope.pushDesignDocsErrors = false;
        
    }]);

    AdminCtrlModule.config(function ($routeProvider) {
        $routeProvider.when('/admin', {templateUrl: constants.templatePrefix + 'admin.html',  controller: 'AdminCtrl'});
    });
    
    return AdminCtrlModule;
});