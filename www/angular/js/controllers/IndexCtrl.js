define(['angular', '../services/Authentication', '../directives/Markdown'], function (angular) {
    "use strict";
    
    var IndexCtrlModule = angular.module(
        'commissar.controllers.IndexCtrl',
        ['commissar.services.Authentication', 'commissar.directives.Markdown']
    );
    
    IndexCtrlModule.controller('IndexCtrl', ['$scope', function ($scope) {
        $scope.name = 'IndexCtrl';
    }]);

    IndexCtrlModule.config(['$routeProvider', function ($routeProvider) {
        var routeprefix = "angular/templates/";

        $routeProvider.when('/', {templateUrl: routeprefix + 'index.html',  controller: 'IndexCtrl'});
    }]);
    
    return IndexCtrlModule;
});