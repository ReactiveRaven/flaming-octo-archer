define('app', ['angular', 'bootstrap', 'controllers/IndexCtrl', 'controllers/WelcomeCtrl', 'controllers/MenuCtrl', 'controllers/GalleryCtrl'], function (angular) {
    "use strict";
    
    var App = angular.module('commissar', ['commissar.controllers.IndexCtrl', 'commissar.controllers.MenuCtrl', 'commissar.controllers.WelcomeCtrl', 'commissar.controllers.GalleryCtrl']);
    App.config(['$locationProvider', function ($locationProvider) {
        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix("!");
    }]);

    return App;
});