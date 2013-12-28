/* globals angular:false */
define(['constants', 'services/Authentication', 'directives/Markdown', 'filters/Capitalize'], function (constants) {
    "use strict";
    
    var WelcomeCtrlModule = angular.module(
        'commissar.controllers.WelcomeCtrl',
        ['commissar.services.Authentication', 'commissar.directives.Markdown', 'commissar.filters.Capitalize']
    );
    
    WelcomeCtrlModule.controller('WelcomeCtrl', ['$scope', function ($scope) {
        $scope.name = 'WelcomeCtrl';
    }]);

    WelcomeCtrlModule.config(function ($routeProvider) {
        $routeProvider.when('/welcome', {templateUrl: constants.templatePrefix + 'welcome.html',  controller: 'WelcomeCtrl'});
    });
    
    return WelcomeCtrlModule;
});