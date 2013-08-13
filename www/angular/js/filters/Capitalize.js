define(['angular'], function (angular) {
    "use strict";
    
    var CapitalizeModule = angular.module('commissar.filters.Capitalize', []);
    
    CapitalizeModule.filter('Capitalize', function () {
        return function (input, scope) {
            scope = scope; // not used
            if (input) {
                return input.substring(0, 1).toUpperCase() + input.substring(1);
            }
            return null;
        };
    });
    
});