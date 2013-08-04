(function () {
    'use strict';
    
    var defaultControllers = [
        'IndexCtrl'
    ];
    
    var controllers = typeof controllers === "undefined" ? defaultControllers : controllers;
    
    var requireds = [];
    var includes = [];
    for (var i = 0; i < controllers.length; i++) {
        requireds.push('controllers/' + controllers[i]);
        includes.push('commissar.controllers.' + controllers[i]);
    }
    requireds = ['angular'].concat(requireds);
    
    define(requireds, function (angular) {
        var App = angular.module('commissar', includes);
        App.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
            $routeProvider.otherwise({redirectTo: '/'});
            
            $locationProvider.html5Mode(false);
            $locationProvider.hashPrefix("!");
        }]);
    
        return App;
    });
})();