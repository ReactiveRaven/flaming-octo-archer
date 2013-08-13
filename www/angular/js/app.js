/* globals e2emocks:false */

define('app', ['angular', 'controllers/IndexCtrl', 'controllers/MenuCtrl'], function (angular) {
    "use strict";
    
    var App = angular.module('commissar', ['commissar.controllers.IndexCtrl', 'commissar.controllers.MenuCtrl'].concat(typeof e2emocks !== 'undefined' ? e2emocks : []));
    App.config(['$locationProvider', function ($locationProvider) {
        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix("!");
    }]);

    return App;
});