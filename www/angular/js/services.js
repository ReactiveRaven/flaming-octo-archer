angular.module('commisarServices', ['ngResource']).
    factory('Offer', function($resource){
        return $resource(
            '/artist/:artist/:offer.json', 
            {}, 
            {
                query: {method:'GET', params:{artist:"browse", offer: "browse"}, isArray:true}
            }
          );
      }
    ).
    factory('Artist', function($resource){
        return $resource(
            '/artist/:artist.json', 
            {}, 
            {
                query: {method:'GET', params:{artist:"browse"}, isArray:true}
            }
          );
      }
    ).
    factory('Resource', function($resource){
        return $resource(
            '/resource/:artist/:resource.json', 
            {}, 
            {
                query: {method:'GET', params:{artist:"me", resource:"index"}, isArray:true}
            }
          );
      }
    ).
    factory('Featured', function($resource){
        return $resource(
            '/menu/featured/:type.json', 
            {}, 
            {
                query: {method:'GET', params:{type: "all"}, isArray:true}
            }
          );
      }
    ).
    factory('My', function($resource){
        return $resource(
            '/my/:type/index.json',
            {}, 
            {
                query: {method:'GET', params:{type: "info"}, isArray:true},
                offers: {method:'GET', params:{type: "offers"}, isArray: true},
                pictures: {method:'GET', params:{type: "pictures"}, isArray: true}
            }
          );
      }
    ).
    factory('Picture', function($resource){
        return $resource(
            '/my/pictures/:slug.json',
            {},
            {
                query: {method:'GET', params:{slug: "index"}, isArray:true},
            }
          );
      }
    ).
    factory('Broadcaster', function($rootScope){
        var sharedService = {};
        
        sharedService.broadcast = function (event, arguments) {
            $rootScope.$broadcast(event, arguments);
        };

        return sharedService;
      }
    ).
    factory('Authentication', function($rootScope, Artist){
        var sharedService = {};
        
        var doLogin = function (username, password) {
            alert("AJAX request to get login success or failure?");
            updateMe();
        };
        
        var updateMe = function () {
            $rootScope.me = Artist.get({artist: "me"}, function (data) {
                sharedService.me = $rootScope.me;
            });
        };
        
        
        $rootScope.$on("login", function(event, username, password) {
            doLogin(username, password);
        });
        
        $rootScope.$on("authenticationUpdate", function () {
            updateMe();
        });
        
        
        if (!$rootScope.me) {
            updateMe();
        }
        
        sharedService.me = $rootScope.me;


        return sharedService;
      }
    );