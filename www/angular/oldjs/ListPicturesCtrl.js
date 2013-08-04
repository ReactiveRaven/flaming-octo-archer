
define([], function () {
    
    function ListPicturesCtrl($scope, Authentication, pictures) {
        $scope.me = Authentication.me;
        $scope.pictures = pictures;

        $scope.iOwnThis = function () {
            return true;
        };
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
    
    return ListPicturesCtrl;
});