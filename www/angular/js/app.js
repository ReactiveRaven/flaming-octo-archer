/* globals angular:false */
define(
    'app',
    [
        'controllers/LogoutCtrl',
        'controllers/AdminCtrl',
        'controllers/CommissionPanelCtrl',
        'controllers/IndexCtrl',
        'controllers/WelcomeCtrl',
        'controllers/MenuCtrl',
        'controllers/UploadCtrl',
        'controllers/GalleryCtrl'
    ],
    function () {
        "use strict";

        var App = angular.module(
            'commissar',
            [
                'ngRoute',
                'commissar.controllers.LogoutCtrl',
                'commissar.controllers.AdminCtrl',
                'commissar.controllers.CommissionPanelCtrl',
                'commissar.controllers.IndexCtrl',
                'commissar.controllers.MenuCtrl',
                'commissar.controllers.WelcomeCtrl',
                'commissar.controllers.UploadCtrl',
                'commissar.controllers.GalleryCtrl'
            ]
        );
        App.config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
            $locationProvider.html5Mode(false);
            $locationProvider.hashPrefix("!");
        }]);

        return App;
    }
);