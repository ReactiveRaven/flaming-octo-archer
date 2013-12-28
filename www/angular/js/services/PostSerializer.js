define(['angular', 'jquery'], function (angular, $) {
    "use strict";

    var PostSerializerModule = angular.module('commissar.services.PostSerializer', []);

    PostSerializerModule.factory('PostSerializer', function () {

        var PostSerializer = {
            'serialize': function (input) {
                return $.param(input);
            }
        };

        return PostSerializer;
    });

    return PostSerializerModule;

});