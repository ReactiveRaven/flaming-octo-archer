/* globals angular:false */
define(['constants'], function(constants) {
        "use strict";

        var ExpandToFitModule = angular.module(
            'commissar.directives.KommiExpandToFit', []
        );

        ExpandToFitModule.directive('kommiExpandToFit', function() {
            return {
                link: function(scope, element) {
                    var hiddenDiv = $(document.createElement('div'));
                    var content = null;
                    var commonClasses = $(element).attr('class');

                    $(element).addClass('kommi-expand-to-fit-no-resize');
                    hiddenDiv.addClass('kommi-expand-to-fit-hidden-div kommi-expand-to-fit-no-resize ' + commonClasses);

                    $('body').append(hiddenDiv);

                    var updateHeight = function() {
                        content = $(element).val();

                        content = content.replace(/\n/g, '<br>');
                        hiddenDiv.html(content + '<br class="kommi-expand-to-fit-line-break">');

                        $(element).css('height', hiddenDiv.height());
                    };

                    updateHeight();
                    $(element).on('keyup', updateHeight);
                }
            }
        });

    return ExpandToFitModule;

});