define(['angular', '../services/Authentication', '../filters/Capitalize'], function (angular) {
    "use strict";
    
    var MenuCtrlModule = angular.module(
        'commissar.controllers.MenuCtrl',
        ['commissar.services.Authentication', 'commissar.directives.Markdown', 'commissar.filters.Capitalize']
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
        
        $scope.register = function (username, password) {
                        
            if (typeof username === "undefined") {
                username = $scope.loginFormUsername;
            }
            if (typeof password === "undefined") {
                password = $scope.loginFormPassword;
            }
            
            return Authentication.register(username, password).then(function (reply) { 
                $scope.registerSucceeded = reply;
                return reply;
            });
        };
        
        (function () {
            var lastUsername = null,
                lastResponse = null;
                
            $scope.isUsernameRecognised = function (username) {
                var response = null;
                
                if (typeof username === "undefined") {
                    username = $scope.loginFormUsername;
                }
                
                if (username === lastUsername) {
                    response = lastResponse;
                } else {
                    lastUsername = username;
                    lastResponse = false;
                    Authentication.userExists(username).then(function (reply) {
                        lastResponse = reply;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });
                    response = false;
                }
                
                return response;
            };
            
            // Needed to trigger the form to update as it doesn't actually 
            // contain 'loginFormUsername' as a binding!
            $scope.$watch('loginFormUsername', function () {
                $scope.isUsernameRecognised();
            });
        })();
    }]);
    
    return MenuCtrlModule;
});