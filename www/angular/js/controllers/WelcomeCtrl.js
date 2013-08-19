define(['angular', '../services/Authentication', '../directives/Markdown', '../filters/Capitalize'], function (angular) {
    "use strict";
    
    var WelcomeCtrlModule = angular.module(
        'commissar.controllers.WelcomeCtrl',
        ['commissar.services.Authentication', 'commissar.directives.Markdown', 'commissar.filters.Capitalize']
    );
    
    WelcomeCtrlModule.controller('WelcomeCtrl', ['$scope', function ($scope) {
        $scope.name = 'WelcomeCtrl';
    }]);

    WelcomeCtrlModule.config(['$routeProvider', function ($routeProvider) {
        var routeprefix = "angular/templates/";

        $routeProvider.when('/welcome', {templateUrl: routeprefix + 'welcome.html',  controller: 'WelcomeCtrl'});
    }]);
    
    return WelcomeCtrlModule;
});