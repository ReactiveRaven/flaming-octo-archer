define('app', ['angular', 'controllers/IndexCtrl', 'controllers/MenuCtrl', 'services/CouchValidation'], function (angular) {
    "use strict";
    
    
    
    var App = angular.module('commissar', ['commissar.controllers.IndexCtrl', 'commissar.controllers.MenuCtrl', 'commissar.services.CouchValidation']);
    App.config(['$locationProvider', function ($locationProvider) {
        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix("!");
    }]);

    return App;
});