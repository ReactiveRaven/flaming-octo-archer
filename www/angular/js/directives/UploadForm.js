define(['angular', 'constants', 'services/Authentication', 'services/ParanoidScope'], function (angular, constants) {
    "use strict";

    var UploadFormModule = angular.module('commissar.directives.UploadForm', ['commissar.services.Authentication', 'commissar.services.ParanoidScope']);
    
    UploadFormModule.controller('commissar.directives.UploadForm.controller', function ($scope, Authentication, $location, ParanoidScope) {
        $scope.name = 'commissar.directives.UploadForm.controller';
        
        $scope.valid = function () {
            return ((!!$scope.uploadFormName) && (!!$scope.uploadFormFile));
        };
    });

    UploadFormModule.directive("uploadForm", function (/** /$rootScope/**/) {
        var UploadForm = {
            priority: 0,
            templateUrl: constants.templatePrefix + 'directives/UploadForm.html',
            replace: true,
            transclude: true,
            restrict: 'AE',
            scope: {},
            controller: 'commissar.directives.UploadForm.controller'
        };
        return UploadForm;
    });

    return UploadFormModule;

});