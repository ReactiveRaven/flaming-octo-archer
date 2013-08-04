
define([], function () {
    
    function CreateOfferCtrl($scope, $routeParams, $location, Authentication, Offer, Broadcaster) {
        $scope.me = Authentication.me;
        $scope.artist = $scope.me;

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
            $scope.offer.$save({artist: $routeParams.artist, offer: "create"}, function (data) {
                if ($routeParams.offer !== data.slug) {
                    $location.path("/artist/" + $scope.me.slug + "/" + data.slug).replace();
                } else {
                    $scope.saving = false;
                }
                Broadcaster.broadcast("offerCreated", $scope.offer);
                Broadcaster.broadcast("offerUpdated", $scope.offer);
            });
        };
    }

    CreateOfferCtrl.$inject = ['$scope', '$routeParams', '$location', 'Authentication', 'Offer', 'Broadcaster'];
    
    return CreateOfferCtrl;
});