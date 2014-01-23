/* globals angular:false */
define([], function () {
    "use strict";
    
    var NotThumbnailModule = angular.module('commissar.filters.NotThumbnail', []);
    
    NotThumbnailModule.filter('NotThumbnail', function () {
        return function (input) {
            if (input) {
                
                var array = {};
                
                angular.forEach(input, function (attachment, filename) {
                    if (filename.indexOf("__thumb_") < 0) {
                        array[filename] = attachment;
                    }
                });

                return array;
            } else {
                return null;
            }
        };
    });
    
});