define(['angular', 'constants', 'jquery', 'services/Authentication', 'services/ParanoidScope'], function (angular, constants, jquery) {
    "use strict";

    var UploadFormModule = angular.module('commissar.directives.UploadForm', ['commissar.services.Authentication', 'commissar.services.ParanoidScope']);
    
    UploadFormModule.controller('commissar.directives.UploadForm.controller', function ($scope) {
        $scope.name = 'commissar.directives.UploadForm.controller';
        
        $scope.valid = function () {
            return ((!!$scope.uploadFormName) && (!!$scope.uploadFormFile));
        };
        
        $scope.$on("filechanged", function (event, elem) {
            console.log(elem.val());
        });
    });

    UploadFormModule.directive("uploadForm", function () {
        var UploadForm = {
            priority: 0,
            templateUrl: constants.templatePrefix + 'directives/UploadForm.html',
            replace: true,
            transclude: true,
            restrict: 'AE',
            scope: {},
            controller: 'commissar.directives.UploadForm.controller',
            link: function ($scope, $element) {
                var $fileinput = jquery($element).find('input[type=file]');
                $fileinput.on("change", function () {
                    $scope.$broadcast('filechanged', $fileinput);
                });
            }
        };
        return UploadForm;
    });

    return UploadFormModule;

});