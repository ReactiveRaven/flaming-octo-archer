
define([], function () {
    
    function ViewPicturesCtrl($scope, Authentication, picture) {
        $scope.me = Authentication.me;
        $scope.picture = picture;

        $scope.iOwnThis = function () {
            return true;
        };

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
    
    return ViewPicturesCtrl;
});