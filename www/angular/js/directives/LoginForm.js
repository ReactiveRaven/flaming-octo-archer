define(['angular', 'constants'], function (angular, constants) {
    "use strict";

    var LoginFormModule = angular.module('commissar.directives.LoginForm', []);

    LoginFormModule.directive("loginForm", function (/** /$rootScope/**/) {
        var LoginForm = {
            priority: 0,
            templateUrl: constants.templatePrefix + 'directives/LoginForm.html',
            replace: true,
            restrict: 'AE',
            scope: {},
            controller: function ($scope, Authentication, $location) {
                        
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
            }
        };
        return LoginForm;
    });

    return LoginFormModule;

});