/* globals angular:false */
define(['../constants', '../services/Authentication', '../services/ParanoidScope'], function (constants) {
    "use strict";

    var BackendMenuModule = angular.module(
        'commissar.directives.BackendMenu',
        [
            'commissar.services.Authentication',
            'commissar.services.ParanoidScope'
        ]
    );
    
    BackendMenuModule.controller('commissar.directives.BackendMenu.controller', function ($scope, Authentication) {
        $scope.controllerName = 'commissar.directives.BackendMenu.controller';
        
        Authentication.hasRole("+admin").then(function (hasRole) {
            $scope.menuItems.splice(
                $scope.menuItems.length - 1, 
                0, 
                {
                    title: 'Admin',
                    href: '#!/admin',
                    img: '/img/icon-admin.png'
                }
            );
        });
        
        $scope.menuItems = [
            {
                title: 'Commissions',
                href: '#!/my/commissions',
                img: '/img/icon-commissions.png'
            },
            {
                title: 'Price list',
                href: '#!/my/pricelist',
                img: '/img/icon-pricelist.png'
            },
            {
                title: 'Profile',
                href: '#!/my/profile',
                img: '/img/icon-profile.png'
            },
            {
                title: 'Files',
                href: '#!/my/files',
                img: '/img/icon-files.png'
            },
            {
                title: 'Log out',
                href: '#!/logout',
                img: '/img/icon-logout.png'
            }
        ];
    });

    BackendMenuModule.directive("backendmenu", function (/** /$rootScope/**/) {
        var BackendMenu = {
            priority: 0,
            templateUrl: constants.templatePrefix + 'menu/backend.html',
            replace: true,
            transclude: true,
            restrict: 'AE',
            require: 'active',
            scope: {
                active: '@'
            },
            controller: 'commissar.directives.BackendMenu.controller'
        };
        return BackendMenu;
    });

    return BackendMenuModule;

});