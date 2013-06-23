angular.
    module('commissar', ['commisarServices', 'CornerCouch']).
    config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  
        var routeprefix = "/angular/templates/";

        $routeProvider.
            when('/', {templateUrl: routeprefix + 'index.html',  controller: IndexCtrl}).
            when('/artist', {templateUrl: routeprefix + 'offers/browse.html',  controller: BrowseOffersCtrl, resolve: BrowseOffersCtrl.resolve}).
            when('/artist/:artist', {templateUrl: routeprefix + 'offers/list.html',  controller: ListOffersCtrl, resolve: ListOffersCtrl.resolve}).
            when('/artist/:artist/create', {templateUrl: routeprefix + 'offers/view.html',  controller: CreateOfferCtrl}).
            when('/artist/:artist/:offer', {templateUrl: routeprefix + 'offers/view.html',  controller: ViewOfferCtrl, /**/resolve: ViewOfferCtrl.resolve, /**/ reloadOnSearch: false}).
            when('/my/pictures', {templateUrl: routeprefix + 'pictures/list.html',  controller: ListPicturesCtrl, /**/resolve: ListPicturesCtrl.resolve}).
            when('/my/pictures/:picture', {templateUrl: routeprefix + 'pictures/view.html',  controller: ViewPicturesCtrl, /**/resolve: ViewPicturesCtrl.resolve}).
            otherwise({redirectTo: '/'});
    
        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix("!");
    }]).
    directive('markdown', function() {
        var link = function(scope, element, attrs, model) {
            var render = function(){
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
    }).directive("loadingIndicator", function($rootScope) {
        return {
            restrict: 'A',
            link: function(scope, element) {
                $rootScope.$on('$routeChangeStart', function() {
                    element.addClass('show');
                });
                $rootScope.$on('$routeChangeSuccess', function() {
                    element.removeClass('show');
                    setTimeout(function () { // needs to be outside the render bubble
                        $("input[data-resizable]").trigger("input");
                    }, 0);
                });
            }
        };
    }).filter('capitalize', function() {
        return function(input, scope) {
            if (input) {
            return input.substring(0,1).toUpperCase()+input.substring(1);
            }
            return null;
        }
    });