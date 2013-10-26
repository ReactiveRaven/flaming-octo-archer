define(['angular', 'angularCookies', './Couch', './PostSerializer'], function (angular) {
    "use strict";
    
    var AuthenticationModule = angular.module('commissar.services.Authentication', ['commissar.services.Couch', 'commissar.services.PostSerializer', 'ngCookies']);
    
    AuthenticationModule.factory('Authentication', function (Couch, $q, $cookies, $http, PostSerializer, $rootScope) {
            
        var Authentication = {
            'userExists': function (username) {
                if (typeof username === 'undefined') {
                    var deferred = $q.defer();
                    deferred.resolve(false);
                    return deferred.promise;
                }
                return Couch.databaseExists(Authentication.getDatabaseName(username));
            },
            'loggedIn': function () {
                var deferred = $q.defer();

                if (typeof $cookies.wasLoggedIn !== 'undefined') {
                    Couch.getSession().then(function (userCtx) {
                        deferred.resolve(userCtx.name !== null);
                    });
                } else {
                    deferred.resolve(false);
                }

                return deferred.promise;
            },
            'login': function (username, password) {
                var deferred = $q.defer();

                Couch.login(username, password).then(function (response) {
                    if (response) {
                        $cookies.wasLoggedIn = true;
                    }
                    deferred.resolve(response);
                    $rootScope.$broadcast('AuthChange');
                }, function () {
                    deferred.resolve(false);
                });

                return deferred.promise;
            },
            'register': function (username, password) {
                var deferred = $q.defer();
                
                $http.post('/server/register.php', PostSerializer.serialize({username: username, password: password}), {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }).success(function (data/** /, status, headers/**/) {
                    deferred.resolve(typeof data.ok !== 'undefined' ? true : data.error);
                }).error(function () {
                    deferred.resolve(false);
                });
                
                return deferred.promise;
            },
            'getSession': function () {
                var deferred = $q.defer();
                
                Couch.getSession().then(function (userCtx) {
                    deferred.resolve(userCtx);
                });
                
                return deferred.promise;
            },
            'getDatabaseName': function (username) {
                return 'commissar_user_' + username.toLowerCase();
            }
        };

        return Authentication;
    });
    
    return AuthenticationModule;
    
});