define(['angular', '../services/Authentication'], function (angular) {
    "use strict";
    
    var MenuCtrlModule = angular.module(
        'commissar.controllers.MenuCtrl',
        ['commissar.services.Authentication', 'commissar.directives.Markdown']
    );
    
    MenuCtrlModule.controller('MenuCtrl', ['$scope', 'Authentication', function ($scope, Authentication) {
        $scope.name = 'MenuCtrl';
        
        $scope.loggedIn = null;
        Authentication.loggedIn().then(function (response) {
            $scope.loggedIn = response;
        });
        
        $scope.login = function (username, password) {
            
            if (typeof username === "undefined") {
                username = $scope.loginFormUsername;
            }
            if (typeof password === "undefined") {
                password = $scope.loginFormPassword;
            }
            
            return Authentication.login(username, password).then(function (reply) {
                $scope.loggedIn = reply;
                return reply;
            });
        };
        
        $scope.userExists = function (username) {
            
            if (typeof username === "undefined") {
                username = $scope.loginFormUsername;
            }
            
            return Authentication.userExists(username).then(function (reply) {
                return reply;
            });
        };
    }]);
    
    return MenuCtrlModule;
});