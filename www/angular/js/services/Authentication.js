define(['angular', 'angularCookies', './Couch'], function (angular) {
    "use strict";
    
    var AuthenticationModule = angular.module('commissar.services.Authentication', ['commissar.services.Couch', 'ngCookies']);
    
    AuthenticationModule.factory('Authentication', ['$rootScope', 'Couch', '$q', '$cookies', function ($rootScope, Couch, $q, $cookies) {

        if (!$rootScope.Authentication) {
            var Authentication = {
                'userExists': function (username) {
                    return Couch.databaseExists('commissar_user_' + username);
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

            $rootScope.Authentication = Authentication;
        }

        return $rootScope.Authentication;
    }]);
    
    return AuthenticationModule;
    
});