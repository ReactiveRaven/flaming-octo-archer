define(['angular', 'services/Authentication', 'filters/Capitalize', 'directives/LoginForm'], function (angular) {
    "use strict";
    
    var MenuCtrlModule = angular.module(
        'commissar.controllers.MenuCtrl',
        ['commissar.services.Authentication', 'commissar.directives.Markdown', 'commissar.filters.Capitalize', 'commissar.directives.LoginForm']
    );
    
    MenuCtrlModule.controller('MenuCtrl', function ($scope, Authentication) {
        $scope.name = 'MenuCtrl';
        
        $scope.loggedIn = null;
        Authentication.loggedIn().then(function (response) {
            $scope.loggedIn = response;
        });
        
    });
    
    return MenuCtrlModule;
});