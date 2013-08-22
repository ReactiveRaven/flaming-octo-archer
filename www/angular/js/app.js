define('app', ['angular', 'bootstrap', 'controllers/IndexCtrl', 'controllers/WelcomeCtrl', 'controllers/MenuCtrl'], function (angular) {
    "use strict";
    
    var App = angular.module('commissar', ['commissar.controllers.IndexCtrl', 'commissar.controllers.MenuCtrl', 'commissar.controllers.WelcomeCtrl']);
    App.constant('APP_TEMPLATE_PREFIX', 'angular/templates/');
    App.config(['$locationProvider', function ($locationProvider) {
        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix("!");
    }]);

    return App;
});