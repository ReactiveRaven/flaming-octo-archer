define(['angular', 'marked'], function (angular, marked) {
    "use strict";
    
    var MarkdownModule = angular.module('commissar.directives.Markdown', []);
    
    MarkdownModule.directive('markdown', function () {
        var link = function (scope, element, attrs, model) {
            var render = function () {
                try
                {
                    var htmlText = marked(model.$modelValue);
                    element.html(htmlText);
                    if (element.data("firstparagraph")) {
                        element.html(element.find("p").first());
                    }
                    if (element.data("textonly")) {
                        element.html(element.text());
                    }
                    if (element.data("wordlimit")) {
                        var wordlimit = element.data("wordlimit");
                        var words = element.text().split(" ");
                        if (words.length > wordlimit) {
                            var newWords = [];
                            for (var i = 0; i < wordlimit; i++) {
                                newWords.push(words[i]);
                            }
                            newWords.push("...");
                            words = newWords;
                        }
                        element.html(words.join(" "));
                    }
                }
                catch (e) {
                    /* ignore it */
                }
            };
            scope.$watch(attrs['ngModel'], render);
            render();
        };
        return {
            restrict: 'A',
            require: 'ngModel',
            link: link
        };
    });
    
    return MarkdownModule;
    
});
    