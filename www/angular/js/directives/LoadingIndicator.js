/* globals $:false, angular:false */
define([], function () {
    "use strict";
    
    var LoadingIndicatorModule = angular.module('commissar.directives.LoadingIndicator', []);
    
    LoadingIndicatorModule.directive("loadingIndicator", function ($rootScope) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                $rootScope.$on('$routeChangeStart', function () {
                    element.addClass('show');
                });
                $rootScope.$on('$routeChangeSuccess', function () {
                    element.removeClass('show');
                    setTimeout(function () { // needs to be outside the render bubble
                        $("input[data-resizable]").trigger("input");
                    }, 0);
                });
            }
        };
    });
    
    return LoadingIndicatorModule;
    
});