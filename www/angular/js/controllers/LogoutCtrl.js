/* globals angular:false */
define(['constants', '../services/Authentication', '../directives/Markdown', '../filters/Capitalize'], function (constants) {
    "use strict";
    
    var LogoutCtrlModule = angular.module(
        'commissar.controllers.LogoutCtrl',
        ['commissar.services.Authentication']
    );
    
    LogoutCtrlModule.controller('LogoutCtrl', function ($scope, Authentication) {
        $scope.name = 'LogoutCtrl';
        
        Authentication.logout();
    });

    LogoutCtrlModule.config(function ($routeProvider) {
        $routeProvider.when('/logout', {templateUrl: constants.templatePrefix + 'logout.html',  controller: 'LogoutCtrl'});
    });
    
    return LogoutCtrlModule;
});