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
                    Authentication.getSession()
                ]
            ).then(
                function (returnValues) {
                    $scope.loggedIn = returnValues[0];
                    $scope.userCtx = returnValues[1];
                    var isAdmin = returnValues[1].roles.indexOf('+admin') !== -1;
                    $scope.isAdmin = isAdmin;
                    ParanoidScope.apply($scope);
                    ParanoidScope.digest($scope);
                }
            );
            
        };
        
        $scope.$on('AuthChange', $scope.onAuthChange);
        
    });
    
    return MenuCtrlModule;
});