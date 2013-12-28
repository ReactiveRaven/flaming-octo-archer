/* globals angular:false */
define(['angularCookies', './Couch', './PostSerializer'], function () {
    "use strict";
    
    var AuthenticationModule = angular.module('commissar.services.Authentication', ['commissar.services.Couch', 'commissar.services.PostSerializer']);
    
    AuthenticationModule.factory('Authentication', function (Couch, $q, $http, PostSerializer, $rootScope) {
            
        var Authentication = {};
        Authentication.userExists = function (username) {
            if (typeof username === 'undefined') {
                var deferred = $q.defer();
                deferred.resolve(false);
                return deferred.promise;
            }
            return Couch.databaseExists(Authentication.getDatabaseName(username));
        };
        Authentication.loggedIn = function () {
            return Couch.loggedIn();
        };
        Authentication.hasRole = function (role) {
            return Couch.hasRole(role);
        };
        Authentication.isAdmin = function () {
            return Authentication.hasRole("+admin");
        };
        Authentication.getUsername = function () {
            var deferred = $q.defer();

            Authentication.loggedIn().then(function (loggedIn) {
                if (loggedIn) {
                    Authentication.getSession().then(function (session) {
                        deferred.resolve(session.name);
                    }, deferred.reject);
                } else {
                    deferred.reject("Not logged in");
                }
            }, deferred.reject);

            return deferred.promise;
        };
        Authentication.login = function (username, password) {
            var deferred = $q.defer();

            Couch.login(username, password).then(function (response) {
                deferred.resolve(response);
                $rootScope.$broadcast('AuthChange');
            }, function () {
                deferred.resolve(false);
            });

            return deferred.promise;
        };
        Authentication.register = function (username, password) {
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
        };
        Authentication.getSession = function () {
            return Couch.getSession();
        };
        Authentication.getDatabaseName = function (username) {
            return 'commissar_user_' + username.toLowerCase();
        };
        Authentication.logout = function () {
            Couch.logout().then(function () {
                $rootScope.$broadcast('AuthChange');
            });
        };

        return Authentication;
    });
    
    return AuthenticationModule;
    
});