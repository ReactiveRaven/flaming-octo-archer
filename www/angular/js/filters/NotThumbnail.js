/* globals angular:false */
define([], function () {
    "use strict";
    
    var NotThumbnailModule = angular.module('commissar.filters.NotThumbnail', []);
    
    NotThumbnailModule.filter('NotThumbnail', function () {
        return function (input) {
            if (input) {
                
                var array = {};
                
                angular.forEach(input, function (attachment, filename) {
                    console.log(filename, filename.indexOf("__thumb_") < 0);
                    if (filename.indexOf("__thumb_") < 0) {
                        array[filename] = attachment;
                    }
                });
                
                console.log(array);
                return array;
            } else {
                return null;
            }
        };
    });
    
});