define(['angular', 'angularCookies', './Couch', './PostSerializer'], function (angular) {
    "use strict";
    
    var AuthenticationModule = angular.module('commissar.services.Authentication', ['commissar.services.Couch', 'commissar.services.PostSerializer', 'ngCookies']);
    
    AuthenticationModule.factory('Authentication', function (Couch, $q, $cookies, $http, PostSerializer) {
            
        var Authentication = {
            'userExists': function (username) {
                if (typeof username === 'undefined') {
                    var deferred = $q.defer();
                    deferred.resolve(false);
                    return deferred.promise;
                }
                return Couch.databaseExists('commissar_user_' + username.toLowerCase());
            },
            'loggedIn': function () {
                var deferred = $q.defer();

                if (typeof $cookies.AuthSession !== 'undefined') {
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
                    deferred.resolve(response);
                }, function () {
                    deferred.resolve(false);
                });

                return deferred.promise;
            },
            'register': function (username, password) {
                var deferred = $q.defer();
                
                $http.post('/server/register.php', PostSerializer.serialize({username: username, password: password})).success(function (data/** /, status, headers/**/) {
                    deferred.resolve(typeof data.ok !== 'undefined' ? true : data.error);
                }).error(function () {
                    deferred.resolve(false);
                });
                
                return deferred.promise;
            }
        };

        return Authentication;
    });
    
    return AuthenticationModule;
    
});