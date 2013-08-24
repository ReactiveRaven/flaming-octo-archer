define(['angular', 'services/Authentication', 'filters/Capitalize', 'directives/LoginForm', 'services/ParanoidScope'], function (angular) {
    "use strict";
    
    var MenuCtrlModule = angular.module(
        'commissar.controllers.MenuCtrl',
        ['commissar.services.Authentication', 'commissar.directives.Markdown', 'commissar.filters.Capitalize', 'commissar.directives.LoginForm', 'commissar.services.ParanoidScope']
    );
    
    MenuCtrlModule.controller('MenuCtrl', function ($scope, Authentication, ParanoidScope) {
        $scope.name = 'MenuCtrl';
        
        $scope.loggedIn = false;
        
        $scope.onAuthChange = function () {
            
            ParanoidScope.apply($scope, function () {
                Authentication.loggedIn().then(function (response) {
                    $scope.loggedIn = response;
                });
            });
            ParanoidScope.digest($scope);
        };
        
        $scope.$on('AuthChange', $scope.onAuthChange);
        
        window.MenuScope = $scope;
        
    });
    
    return MenuCtrlModule;
});