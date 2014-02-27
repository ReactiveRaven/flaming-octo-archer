/* globals angular:false */
define(['constants'], function(constants) {
    "use strict";

    var KommiEnterModule = angular.module(
        'commissar.directives.KommiEnter', []
    );

    KommiEnterModule.directive('kommiEnter', function() {
        return {
            link: function(scope, element, attrs) {
                $(element).keypress(function(e) {
                    if (e.which == 13) {
                        if (!e.shiftKey) scope.$apply(attrs['kommiEnter']);
                    }
                });
            }
        };
    });
    return KommiEnterModule;

});
