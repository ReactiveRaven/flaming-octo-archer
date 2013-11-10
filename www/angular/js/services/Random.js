define(['angular'], function (angular) {
    "use strict";
    
    var RandomModule = angular.module('commissar.services.Random', []);
    
    RandomModule.factory("Random", function () {
        
        var Random = {
            getHash: function () {
                return Date.now() + Math.random() + "";
            }
        };
        
        return Random;
    });
    
    return RandomModule;
});