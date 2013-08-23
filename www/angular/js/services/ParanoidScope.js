define(['angular'], function (angular) {
    "use strict";
    
    var ParanoidScopeModule = angular.module('commissar.services.ParanoidScope', []);
    
    ParanoidScopeModule.factory("ParanoidScope", function () {
        
        var ParanoidScope = {
            apply: function (localScope, func) {
                
                if (typeof func === 'undefined') {
                    func = function () {};
                }
                
                if (!localScope.$$phase && !localScope.$root.$$phase) {
                    localScope.apply(func);
                } else {
                    func();
                }
            }
        };
        
        return ParanoidScope;
    });
    
    return ParanoidScopeModule;
});