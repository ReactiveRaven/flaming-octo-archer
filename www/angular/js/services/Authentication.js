define(['angular', 'angularCookies', './Couch'], function (angular) {
    "use strict";
    
    var AuthenticationModule = angular.module('commissar.services.Authentication', ['commissar.services.Couch', 'ngCookies']);
    
    AuthenticationModule.factory('Authentication', ['$rootScope', 'Couch', '$q', '$cookies', function ($rootScope, Couch, $q, $cookies) {
            
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
            }
        };

        return Authentication;
    }]);
    
    return AuthenticationModule;
    
});