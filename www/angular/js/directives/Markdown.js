/* globals angular:false */
define(['marked'], function (marked) {
    "use strict";
    
    var MarkdownModule = angular.module('commissar.directives.Markdown', []);
    
    MarkdownModule.directive('markdown', function () {
        var link = function (scope, element, attrs, model) {
            var render = function () {
                try
                {
                    var htmlText = marked(model.$modelValue);
                    element.html(htmlText);
                    if (typeof attrs.firstparagraph !== 'undefined') {
                        var wrap = document.createElement('div');
                        wrap.appendChild(element.find('p')[0].cloneNode(true));
                        element.html(wrap.innerHTML);
                    }
                    if (typeof attrs.textonly !== 'undefined') {
                        element.html(element.text());
                    }
                    if (typeof attrs.wordlimit !== 'undefined') {
                        var wordlimit = parseInt(attrs.wordlimit, 10);
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
    