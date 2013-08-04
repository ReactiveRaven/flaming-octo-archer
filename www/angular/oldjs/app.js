/* globals 
   angular:false, $:false, IndexCtrl:false, BrowseOffersCtrl:false, 
   ListOffersCtrl:false, CreateOfferCtrl:false, ViewPicturesCtrl:false,
   ListPicturesCtrl:false, ViewOfferCtrl:false 
 */

(function () {
    'use strict';
    
    var defaultControllers = [
        'IndexCtrl'
    ];
    
    var controllers = typeof controllers === "undefined" ? defaultControllers : controllers;
    
    var requireds = [];
    var includes = [];
    for (var i = 0; i < controllers.length; i++) {
        requireds.push('controllers/' + controllers[i]);
        includes.push('commissar.controller.' + controllers[i]);
    }
    requireds = ['angular'].concat(requireds);
    
    define(requireds, function (angular) {
        var App = angular.module('commissar', includes);
        App.config(['$routeProvider', function ($routeProvider) {
            $routeProvider.otherwise({redirectTo: '/'});
        }]);
        return App;
    });
})();


(function (Commissar) {
    "use strict";
    
    Commissar.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        var routeprefix = "/angular/templates/";

        $routeProvider.when('/', {templateUrl: routeprefix + 'index.html',  controller: IndexCtrl});
        $routeProvider.when('/artist', {templateUrl: routeprefix + 'offers/browse.html',  controller: BrowseOffersCtrl, resolve: BrowseOffersCtrl.resolve});
        $routeProvider.when('/artist/:artist', {templateUrl: routeprefix + 'offers/list.html',  controller: ListOffersCtrl, resolve: ListOffersCtrl.resolve});
        $routeProvider.when('/artist/:artist/create', {templateUrl: routeprefix + 'offers/view.html',  controller: CreateOfferCtrl});
        $routeProvider.when('/artist/:artist/:offer', {templateUrl: routeprefix + 'offers/view.html',  controller: ViewOfferCtrl, /**/resolve: ViewOfferCtrl.resolve, /**/ reloadOnSearch: false});
        $routeProvider.when('/my/pictures', {templateUrl: routeprefix + 'pictures/list.html',  controller: ListPicturesCtrl, /**/resolve: ListPicturesCtrl.resolve});
        $routeProvider.when('/my/pictures/:picture', {templateUrl: routeprefix + 'pictures/view.html',  controller: ViewPicturesCtrl, /**/resolve: ViewPicturesCtrl.resolve});
        $routeProvider.otherwise({redirectTo: '/'});
    
        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix("!");
    }]);

    Commissar.directive('markdown', function () {
        var marked = require("../../bower_components/marked/js/marked");
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
            restrict: 'E',
            require: 'ngModel',
            link: link
        };
    });
    Commissar.directive("loadingIndicator", function ($rootScope) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                $rootScope.$on('$routeChangeStart', function () {
                    element.addClass('show');
                });
                $rootScope.$on('$routeChangeSuccess', function () {
                    element.removeClass('show');
                    setTimeout(function () { // needs to be outside the render bubble
                        $("input[data-resizable]").trigger("input");
                    }, 0);
                });
            }
        };
    });
    Commissar.filter('capitalize', function () {
        return function (input, scope) {
            scope = scope; // not used
            if (input) {
                return input.substring(0, 1).toUpperCase() + input.substring(1);
            }
            return null;
        };
    });
    
})(angular.module('commissar', ['commisarServices', 'CornerCouch']));