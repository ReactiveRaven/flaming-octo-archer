
define([], function () {
    
    function ViewOfferCtrl($scope, $routeParams, $location, offer, artist, Offer, Artist, Resource, Broadcaster, Authentication) {
        $scope.name = 'ViewOfferCtrl';

        $scope.artist = artist;
        $scope.offer = offer;

        $scope.editing = false;
        $scope.saving = false;

        $scope.bodyClasses = function () {
            var reply = [];

            if (!$scope.offer.published) {
                reply.push("prototype");
            }
            if ($scope.editing) {
                reply.push("edit");
            }

            return reply.join(" ");
        };

        $scope.iOwnThis = function () {
            return $scope.artist.username === $scope.me.username;
        };

        $scope.edit = function () {
            if ($scope.iOwnThis()) {
                $scope.editing = true;
            } else {
                alert("Something has gone wrong!\nPlease refresh.\n\n:(");
            }
        };

        $scope.save = function () {
            if ($scope.iOwnThis()) {
                $scope.saving = true;
                $scope.editing = false;
                $scope.offer.$save({artist: $routeParams.artist, offer: $routeParams.offer}, function (data) {
                    if ($routeParams.offer !== data.slug) {
                        $location.path("/artist/" + $routeParams.artist + "/" + data.slug).replace();
                    } else {
                        $scope.saving = false;
                    }
                    Broadcaster.broadcast("offerUpdated", $scope.offer);
                });
            } else {
                alert("Something has gone wrong!\nPlease refresh.\n\n:(");
            }
        };

        $scope.publish = function () {
            if ($scope.iOwnThis()) {
                $scope.saving = true;
                $scope.offer.published = true;
                $scope.save();
            } else {
                alert("Something has gone wrong!\nPlease refresh.\n\n:(");
            }
        };

        $scope.unpublish = function () {
            if ($scope.iOwnThis()) {
                $scope.saving = true;
                $scope.offer.published = false;
                $scope.save();
            } else {
                alert("Something has gone wrong!\nPlease refresh.\n\n:(");
            }
        };

        $scope.me = Authentication.me;

        window.viewOfferCtrlScope = $scope;
    }

    ViewOfferCtrl.resolve = {
        artist: function (Artist, $q, $route, $location) {
            var deferred = $q.defer();
            Artist.get(
                {
                    artist: $route.current.params.artist
                },
                function (successData) {
                    deferred.resolve(successData);
                },
                function (/** /errorData/**/) {
                    $location.path("/");
                    deferred.reject(); // you could optionally pass error data here
                }
            );
            return deferred.promise;
        },
        offer: function (Offer, $q, $route, $location) {
            var deferred = $q.defer();
            Offer.get(
                {artist: $route.current.params.artist, offer: $route.current.params.offer},
                function (successData) {
                    deferred.resolve(successData);
                },
                function (errorData) {
                    $location.path("/artist/" + $route.current.params.artist);
                    deferred.reject(errorData); // you could optionally pass error data here
                }
            );
            return deferred.promise;
        }
    };
    
    return ViewOfferCtrl;
});