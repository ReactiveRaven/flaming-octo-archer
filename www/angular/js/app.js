/* globals angular:false */
define(
    'app',
    [
        'controllers/LogoutCtrl',
        'controllers/AdminCtrl',
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
                'commissar.controllers.LogoutCtrl',
                'commissar.controllers.AdminCtrl',
                'commissar.controllers.IndexCtrl',
                'commissar.controllers.MenuCtrl',
                'commissar.controllers.WelcomeCtrl',
                'commissar.controllers.UploadCtrl',
                'commissar.controllers.GalleryCtrl'
            ]
        );
        App.config(['$locationProvider', function ($locationProvider) {
            $locationProvider.html5Mode(false);
            $locationProvider.hashPrefix("!");
        }]);

        return App;
    }
);