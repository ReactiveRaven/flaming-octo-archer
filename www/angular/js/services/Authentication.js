define(['angular', './Couch'], function (angular) {
    "use strict";
    
    var AuthenticationModule = angular.module('commissar.services.Authentication', ['commissar.services.Couch']);
    
    AuthenticationModule.factory('Authentication', ['$rootScope', 'Couch', function ($rootScope, Couch) {
        
        if (!$rootScope.Authentication) {
            var Authentication = {
                'userExists': function (username) {
                    return Couch.databaseExists('commissar_user_' + username);
                }
            };
//
//            var doLogin = function (/** /username, password/**/) {
//                console.log("AJAX request to get login success or failure?");
//                updateMe();
//            };
//
//            var updateMe = function () {
//                $rootScope.me = Artist.get({artist: "me"}, function () {
//                    Authentication.me = $rootScope.me;
//                });
//            };
//
//
//            $rootScope.$on("login", function (event, username, password) {
//                doLogin(username, password);
//            });
//
//
//            if (!$rootScope.me) {
//                updateMe();
//            }
//
//            Authentication.me = $rootScope.me;

            $rootScope.Authentication = Authentication;
        }

        return $rootScope.Authentication;
    }]);
    
    return AuthenticationModule;
    
});