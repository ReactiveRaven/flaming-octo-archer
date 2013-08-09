define(['angular', '../services/Authentication', '../directives/Markdown', '../filters/Capitalize'], function (angular) {
    "use strict";
    
    var IndexCtrlModule = angular.module(
        'commissar.controllers.IndexCtrl',
        ['commissar.services.Authentication', 'commissar.directives.Markdown', 'commissar.filters.Capitalize']
    );
    
    IndexCtrlModule.controller('IndexCtrl', ['$scope', function ($scope) {
        $scope.name = 'IndexCtrl';
    }]);

    IndexCtrlModule.config(['$routeProvider', function ($routeProvider) {
        var routeprefix = "angular/templates/";

        $routeProvider.when('/', {templateUrl: routeprefix + 'index.html',  controller: 'IndexCtrl'});
        $routeProvider.otherwise({redirectTo: '/'});
    }]);
    
    return IndexCtrlModule;
});