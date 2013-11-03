define(['angular', 'services/Authentication', 'filters/Capitalize', 'directives/LoginForm', 'services/ParanoidScope'], function (angular) {
    "use strict";
    
    var MenuCtrlModule = angular.module(
        'commissar.controllers.MenuCtrl',
        ['commissar.services.Authentication', 'commissar.directives.Markdown', 'commissar.filters.Capitalize', 'commissar.directives.LoginForm', 'commissar.services.ParanoidScope']
    );
    
    MenuCtrlModule.controller('MenuCtrl', function ($scope, Authentication, ParanoidScope, $q) {
        $scope.name = 'MenuCtrl';
        
        $scope.loggedIn = false;
        $scope.isAdmin = false;
        
        $scope.onAuthChange = function () {
            
            $q.all(
                [
                    Authentication.loggedIn(),
                    Authentication.getSession(),
                    Authentication.hasRole("+admin")
                ]
            ).then(
                function (returnValues) {
                    $scope.loggedIn = returnValues[0];
                    $scope.userCtx = returnValues[1];
                    $scope.isAdmin = !!returnValues[2];
                    ParanoidScope.apply($scope);
                    ParanoidScope.digest($scope);
                }
            );
            
        };
        
        $scope.onAuthChange();
        
        $scope.$on('AuthChange', $scope.onAuthChange);
        
    });
    
    return MenuCtrlModule;
});