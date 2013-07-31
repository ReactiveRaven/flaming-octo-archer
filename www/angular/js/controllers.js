'use strict';

/* Controllers */

function MenuCtrl($scope, $rootScope, Featured, My, Authentication, cornercouch) {
    
    $scope.couch = cornercouch("/couchdb", "GET");
    
    $scope.allusers = [];
    
//    $scope.couch.getDB("commissar_users").queryAll().then(function (data) {
//        console.log(data.data.rows);
//    });

    var updateTicks = 0;

    var update = function() {

        My.offers({}, function(data) {
            $scope.myOffers = data;
        });

        if (updateTicks++ % 5 === 0) {
//            $scope.featuredOffers = Featured.get({type: "offers"});
//            $scope.featuredArtists = Featured.get({type: "artists"});
        }
    };
    
    $scope.loginUsername = "";
    
    $scope.isUsernameRecognised = function () {
      
      if (!$scope.couch.databases || !$scope.couch.databases.length) {
        $scope.couch.getDatabases().then(function() {
          $rootScope.$apply();
        });
      } else {
        if ($.inArray("commissar_user_" + $scope.loginUsername, $scope.couch.databases) >= 0) {
          return true;
        }
      }
      
      return false;
    }
    
    $scope.isLoginOrSignup = function () {
        //var CDBUsers = $scope.couch.getDB("commissar_users");
        
        //console.log(CDBUsers.getDoc($scope));
    };

    $scope.menuClasses = function() {
        var classes = [];

        classes.push("navbar");
        classes.push("navbar-static-top");

        return classes.join(" ");
    };

    $scope.$on("offerUpdated", function(event, offer) {
        angular.forEach($scope.myOffers, function (value, key) {
            if (value.id === offer.id) {
                $scope.myOffers[key] = offer;
            }
        });
    });
    
    $scope.$on("offerCreated", function (event, offer) {
        update();
    });
    
    $scope.isLoggedIn = function () {
        return !!$scope.me.username;
    };
    
    $scope.me = Authentication.me;

    update();
    //setInterval(update, 1000 * 60);

    window.menuCtrlScope = $scope;
}

//MenuCtrl.$inject = ['$scope', 'Featured', 'My', 'Authentication'];


function IndexCtrl($scope, $http) {
    $scope.name = 'IndexCtrl';
}

//PhoneListCtrl.$inject = ['$scope', '$http'];


function BrowseOffersCtrl($scope, $http) {
    $scope.name = 'BrowseOffersCtrl';
}

//PhoneListCtrl.$inject = ['$scope', '$http'];


function ListOffersCtrl($scope, $location, $routeParams, artist, offers, Authentication) {
    $scope.name = 'ListOffersCtrl';

    $scope.artist = artist;
    $scope.offers = offers;
    
    $scope.iOwnThis = function () {
        return $scope.artist.username === $scope.me.username;
    };
    
//    $scope.me = Artist.get({artist: "me"}, function(data) {
//        if ($scope.artist.username === $scope.me.username) {
//            $scope.artistResources = Resource.query();
//            $scope.iOwnThis = true;
//        }
//    });
    
    $scope.me = Authentication.me;

    window.listOffersCtrlScope = $scope;
}
;

ListOffersCtrl.resolve = {
    artist: function(Artist, $q, $route, $location) {
        var deferred = $q.defer();
        Artist.get(
                {
                    artist: $route.current.params.artist
                },
                function(successData) {
                    deferred.resolve(successData);
                },
                function(errorData) {
                    $location.path("/");
                    deferred.reject(); // you could optionally pass error data here
                }
        );
        return deferred.promise;
    },
    offers: function(Offer, $q, $route, $location) {
        var deferred = $q.defer();
        Offer.query(
                {artist: $route.current.params.artist, offer: "browse"},
        function(successData) {
            deferred.resolve(successData);
        }, function(errorData) {
            $location.path("/artist/" + $route.current.params.artist);
            deferred.reject(); // you could optionally pass error data here
        }
        );
        return deferred.promise;
    }
};

//PhoneListCtrl.$inject = ['$scope', '$http'];


function ViewOfferCtrl($scope, $routeParams, $location, offer, artist, Offer, Artist, Resource, Broadcaster, Authentication) {
    $scope.name = 'ViewOfferCtrl';

    $scope.artist = artist;
    $scope.offer = offer;

    $scope.editing = false;
    $scope.saving = false;

    $scope.bodyClasses = function() {
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

    $scope.edit = function() {
        if ($scope.iOwnThis()) {
            $scope.editing = true;
        } else {
            alert("Something has gone wrong!\nPlease refresh.\n\n:(");
        }
    };

    $scope.save = function() {
        if ($scope.iOwnThis()) {
            $scope.saving = true;
            $scope.editing = false;
            $scope.offer.$save({artist: $routeParams.artist, offer: $routeParams.offer}, function(data) {
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
    artist: function(Artist, $q, $route, $location) {
        var deferred = $q.defer();
        Artist.get(
                {
                    artist: $route.current.params.artist
                },
        function(successData) {
            deferred.resolve(successData);
        },
                function(errorData) {
                    $location.path("/");
                    deferred.reject(); // you could optionally pass error data here
                }
        );
        return deferred.promise;
    },
    offer: function(Offer, $q, $route, $location) {
        var deferred = $q.defer();
        Offer.get(
                {artist: $route.current.params.artist, offer: $route.current.params.offer},
        function(successData) {
            deferred.resolve(successData);
        }, function(errorData) {
            $location.path("/artist/" + $route.current.params.artist);
            deferred.reject(); // you could optionally pass error data here
        }
        );
        return deferred.promise;
    }
};

function CreateOfferCtrl($scope, $routeParams, $location, Authentication, Offer) {
    $scope.me = Authentication.me;
    $scope.artist = $scope.me;
    
    $scope.bodyClasses = function() {
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
        return true;
    };
    
    $scope.offer = new Offer();
    $scope.offer.title = "My new offer";
    $scope.offer.description = "A description of my new offer.\n\nIt uses markdown; scroll down to see how it looks\n\n|Name|Job            |\n|----|---------------|\n|Alex|Brain Scientist|\n|Stef|Rocket Surgeon |\n\nThis pie is *really* **really** good.\n\n* Red\n* Orange\n* Yellow\n* Green\n* Blue\n  * My favourite!\n* Indigo\n* Violet\n\n";
    
    $scope.editing = true;
    $scope.saving = false;
    
    $scope.publish = function () {
        $scope.offer.published = true;
        $scope.save();
    };
    
    $scope.save = function () {
        $scope.saving = true;
        $scope.editing = false;
        $scope.offer.$save({artist: $routeParams.artist, offer: "create"}, function(data) {
            if ($routeParams.offer !== data.slug) {
                $location.path("/artist/" + $scope.me.slug + "/" + data.slug).replace();
            } else {
                $scope.saving = false;
            }
            Broadcaster.broadcast("offerCreated", $scope.offer);
            Broadcaster.broadcast("offerUpdated", $scope.offer);
        });
    };
};

function ListPicturesCtrl($scope, Authentication, pictures) {
    $scope.me = Authentication.me;
    $scope.pictures = pictures;
    
    $scope.iOwnThis = function () {
        return true;
    }
}

ListPicturesCtrl.resolve = {
    pictures: function (My, $q, $location) {
        var deferred = $q.defer();
        My.pictures({}, function (successData) {
            deferred.resolve(successData);
        }, function (errorData) {
            $location.path("/");
            deferred.reject(errorData);
        });
        return deferred.promise;
    }
};

function ViewPicturesCtrl($scope, Authentication, picture) {
    $scope.me = Authentication.me;
    $scope.picture = picture;
    
    $scope.iOwnThis = function () {
        return true;
    }
    
    window.viewPicturesCtrlScope = $scope;
}

ViewPicturesCtrl.resolve = {
    picture: function (Picture, $q, $location, $route) {
        var deferred = $q.defer();
        
        Picture.get(
            {"slug": $route.current.params.picture},
            function (successData) {
                deferred.resolve(successData);
            },
            function (errorData) {
                $location.path("/my/pictures");
                deferred.reject(errorData);
            }
        );
        return deferred.promise;
    }
};