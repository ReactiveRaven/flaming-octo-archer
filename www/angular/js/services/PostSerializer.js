define(['angular', 'jquery'], function (angular, $) {
    "use strict";

    var PostSerializerModule = angular.module('commissar.services.PostSerializer', []);

    PostSerializerModule.factory('PostSerializer', function () {

        var PostSerializer = {
            'serialize': function (input) {
                input = input; // shut up jshint
                $ = $; // shut up jshint
                
                return $.param(input);
            }
        };

        return PostSerializer;
    });

    return PostSerializerModule;

});