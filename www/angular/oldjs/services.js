/* globals angular:false */
"use strict";

(function (commissarServices) {
    commissarServices.factory('Offer', function ($resource) {
        return $resource(
            '/artist/:artist/:offer.json',
            {},
            {
                query: {method: 'GET', params: {artist: "browse", offer: "browse"}, isArray: true}
            }
        );
    });

    commissarServices.factory('Artist', function ($resource) {
        return $resource(
            '/artist/:artist.json',
            {},
            {
                query: {method: 'GET', params: {artist: "browse"}, isArray: true}
            }
        );
    });

    commissarServices.factory('Resource', function ($resource) {
        return $resource(
            '/resource/:artist/:resource.json',
            {},
            {
                query: {method: 'GET', params: {artist: "me", resource: "index"}, isArray: true}
            }
        );
    });

    commissarServices.factory('Featured', function ($resource) {
        return $resource(
            '/menu/featured/:type.json',
            {},
            {
                query: {method: 'GET', params: {type: "all"}, isArray: true}
            }
        );
    });

    commissarServices.factory('My', function ($resource) {
        return $resource(
            '/my/:type/index.json',
            {},
            {
                query: {method: 'GET', params: {type: "info"}, isArray: true},
                offers: {method: 'GET', params: {type: "offers"}, isArray: true},
                pictures: {method: 'GET', params: {type: "pictures"}, isArray: true}
            }
        );
    });

    commissarServices.factory('Picture', function ($resource) {
        return $resource(
            '/my/pictures/:slug.json',
            {},
            {
                query: {method: 'GET', params: {slug: "index"}, isArray: true}
            }
        );
    });

    commissarServices.factory('Broadcaster', function ($rootScope) {
        var sharedService = {};

        sharedService.broadcast = function (event, args) {
            $rootScope.$broadcast(event, args);
        };

        return sharedService;

    });

    commissarServices.factory('Couch', function ($rootScope, cornercouch) {
        if (!$rootScope.cornercouch) {
            $rootScope.cornercouch = cornercouch("/couchdb", "GET");
            $rootScope.cornercouch.getDatabases();
        }
        
        var Couch = {
            databaseExists: function (databaseName) {
                return ($rootScope.cornercouch.databases.indexOf(databaseName) > -1);
            }
        };

        return Couch;
    });
    
    
    
    commissarServices.factory('Authentication', function ($rootScope, Couch) {
        
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
    });
    
//    require(['./services/Authentication.js'], function (Authentication) {
//        commissarServices.factory('Authentication', Authentication);
//    });
//    

})(angular.module('commisarServices', ['ngResource', 'CornerCouch']));