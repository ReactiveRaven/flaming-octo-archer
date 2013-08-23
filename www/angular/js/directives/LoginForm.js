define(['angular', 'constants', 'services/Authentication', 'services/ParanoidScope'], function (angular, constants) {
    "use strict";

    var LoginFormModule = angular.module('commissar.directives.LoginForm', ['commissar.services.Authentication', 'commissar.services.ParanoidScope']);
    
    LoginFormModule.controller('commissar.directives.LoginForm.controller', function ($scope, Authentication, $location, ParanoidScope) {
        $scope.name = 'commissar.directives.LoginForm.controller';
        
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
            
            var deferred = Authentication.register(username, password);
            
            deferred.then(function (reply) {
                if (reply === true) {
                    $location.path("/welcome");
                }
            });
                    
            return deferred;
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
                        ParanoidScope.apply($scope, function () {
                            lastResponse = reply;
                        });
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
    });

    LoginFormModule.directive("loginForm", function (/** /$rootScope/**/) {
        var LoginForm = {
            priority: 0,
            templateUrl: constants.templatePrefix + 'directives/LoginForm.html',
            replace: true,
            transclude: true,
            restrict: 'AE',
            scope: {},
            controller: 'commissar.directives.LoginForm.controller'
        };
        return LoginForm;
    });

    return LoginFormModule;

});