
define([], function () {
    function ListOffersCtrl($scope, $location, $routeParams, artist, offers, Authentication) {
        $scope.name = 'ListOffersCtrl';

        $scope.artist = artist;
        $scope.offers = offers;

        $scope.iOwnThis = function () {
            return $scope.artist.username === $scope.me.username;
        };

    //    $scope.me = Artist.get({artist: "me"}, function (data) {
    //        if ($scope.artist.username === $scope.me.username) {
    //            $scope.artistResources = Resource.query();
    //            $scope.iOwnThis = true;
    //        }
    //    });

        $scope.me = Authentication.me;

        window.listOffersCtrlScope = $scope;
    }


    ListOffersCtrl.resolve = {
        artist: function (Artist, $q, $route, $location) {
            var deferred = $q.defer();
            Artist.get(
                {
                    artist: $route.current.params.artist
                },
                function (successData) {
                    deferred.resolve(successData);
                },
                function (/**/errorData/**/) {
                    $location.path("/");
                    deferred.reject(errorData); // you could optionally pass error data here
                }
            );
            return deferred.promise;
        },
        offers: function (Offer, $q, $route, $location) {
            var deferred = $q.defer();
            Offer.query(
                {artist: $route.current.params.artist, offer: "browse"},
                function (successData) {
                    deferred.resolve(successData);
                },
                function (/** /errorData/**/) {
                    $location.path("/artist/" + $route.current.params.artist);
                    deferred.reject(); // you could optionally pass error data here
                }
            );
            return deferred.promise;
        }
    };
    
    return ListOffersCtrl;
});