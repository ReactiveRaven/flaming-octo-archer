define('appmocked', ['angular', 'services/E2EMocks', 'controllers/IndexCtrl', 'controllers/MenuCtrl'], function (angular) {
    "use strict";
    
    var App = angular.module('commissar', ['commissar.services.E2EMocks', 'commissar.controllers.IndexCtrl', 'commissar.controllers.MenuCtrl']);
    App.config(['$locationProvider', function ($locationProvider) {
        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix("!");
    }]);

    if (typeof window.e2emocks !== 'undefined') {

        App.run(['$httpBackend', 'E2EMocks', function ($httpBackend) {

            console.log("RUNNING MOCKED");

            $httpBackend.shut_up_jshint = true;

        }]);

    }

    return App;
});