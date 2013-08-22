define(['angular', 'constants', '../services/Authentication', '../directives/Markdown', '../filters/Capitalize'], function (angular, constants) {
    "use strict";
    
    var IndexCtrlModule = angular.module(
        'commissar.controllers.IndexCtrl',
        ['commissar.services.Authentication', 'commissar.directives.Markdown', 'commissar.filters.Capitalize']
    );
    
    IndexCtrlModule.controller('IndexCtrl', function ($scope) {
        $scope.name = 'IndexCtrl';
    });

    IndexCtrlModule.config(function ($routeProvider) {
        $routeProvider.when('/', {templateUrl: constants.templatePrefix + 'index.html',  controller: 'IndexCtrl'});
        $routeProvider.otherwise({redirectTo: '/'});
    });
    
    return IndexCtrlModule;
});