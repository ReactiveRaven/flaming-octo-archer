define(['angular', 'constants', 'jquery', 'services/Authentication', 'services/ParanoidScope', 'services/Couch', 'services/Random'], function (angular, constants, jquery) {
    "use strict";

    var UploadFormModule = angular.module(
        'commissar.directives.UploadForm',
        [
            'commissar.services.Authentication',
            'commissar.services.ParanoidScope',
            'commissar.services.Couch',
            'commissar.services.Random'
        ]
    );
    
    UploadFormModule.controller('commissar.directives.UploadForm.controller', function ($scope, $q, Couch, Authentication, Random) {
        $scope.name = 'commissar.directives.UploadForm.controller';
        
        $scope.valid = function () {
            return ((!!$scope.uploadFormName) && (!!$scope.uploadFormFile));
        };
        
        $scope.fileChanged = function (angularEvent, input) {
            $scope.$apply(function () {
                $scope.uploadFormFile = input[0].files;
            });
        };
        
        $scope.$on("filechanged", function () {
            $scope.fileChanged.apply($scope, arguments);
        });
        
        $scope.upload = function () {
            var deferred = $q.defer();
            if ($scope.valid()) {
                Authentication.getUsername().then(function (username) {
                    var databaseName = Authentication.getDatabaseName(username);
                    Couch.newDoc(databaseName).then(function (document) {
                        document._id = username + "_media_" + Random.getHash();
                        document.author = username;
                        document.type = 'media';
                        document.mediaType = 'image';
                        document.title = $scope.uploadFormName;
                        document.created = Math.floor(Date.now() / 1000);
                        Couch.saveDoc(document, databaseName).then(function () {
                            document.attach($scope.uploadFormFile[0]).then(function () {
                                deferred.resolve(true);
                            }, deferred.reject);
                        }, deferred.reject);
                    });
                }, deferred.reject);
            } else {
                deferred.reject("Not valid");
            }
            
            return deferred.promise;
        };
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
                $fileinput.on("change", function (event) {
                    $scope.$broadcast('filechanged', $fileinput, event);
                });
            }
        };
        return UploadForm;
    });

    return UploadFormModule;

});