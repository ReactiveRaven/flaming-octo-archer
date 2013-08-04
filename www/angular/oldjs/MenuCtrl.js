
define([], function () {
    function MenuCtrl($scope, $rootScope, Featured, My, Authentication, cornercouch) {

        $scope.couch = cornercouch("/couchdb", "GET");

        $scope.allusers = [];

        var updateTicks = 0;

        var update = function () {

            My.offers({}, function (data) {
                $scope.myOffers = data;
            });

            if (updateTicks++ % 5 === 0 && false) {
                $scope.featuredOffers = Featured.get({type: "offers"});
                $scope.featuredArtists = Featured.get({type: "artists"});
            }
        };

        $scope.loginUsername = "";

        $scope.isUsernameRecognised = function () {

            if (!$scope.couch.databases || !$scope.couch.databases.length) {
                $scope.couch.getDatabases().then(function () {
                    $rootScope.$apply();
                });
            } else {
                if ($.inArray("commissar_user_" + $scope.loginUsername, $scope.couch.databases) >= 0) {
                    return true;
                }
            }

            return false;
        };

        $scope.isLoginOrSignup = function () {
            //var CDBUsers = $scope.couch.getDB("commissar_users");

            //console.log(CDBUsers.getDoc($scope));
        };

        $scope.menuClasses = function () {
            var classes = [];

            classes.push("navbar");
            classes.push("navbar-static-top");

            return classes.join(" ");
        };

        $scope.$on("offerUpdated", function (event, offer) {
            angular.forEach($scope.myOffers, function (value, key) {
                if (value.id === offer.id) {
                    $scope.myOffers[key] = offer;
                }
            });
        });

        $scope.$on("offerCreated", function (/** /event, offer/**/) {
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

    MenuCtrl.$inject = ['$scope', '$rootScope', 'Featured', 'My', 'Authentication', 'cornercouch'];
    
    return MenuCtrl;
});