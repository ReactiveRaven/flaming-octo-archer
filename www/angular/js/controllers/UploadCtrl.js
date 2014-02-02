/* globals angular:false */
define(
    [
        'constants',
        'directives/UploadForm',
        'services/ParanoidScope'
    ], function (constants) {
    "use strict";
    
    var UploadCtrlModule = angular.module(
        'commissar.controllers.UploadCtrl',
        [
            'commissar.directives.UploadForm',
            'commissar.services.ParanoidScope'
        ]
    );
    
    UploadCtrlModule.controller('UploadCtrl', function ($scope/** /, ParanoidScope, $location /**/) {
        $scope.name = 'UploadCtrl';
    });

    UploadCtrlModule.config(function ($routeProvider) {
        $routeProvider.when(
            '/my/gallery/upload',
            {
                templateUrl: constants.templatePrefix + 'gallery/upload.html',
                controller: 'UploadCtrl'
            }
        );
    });
    
    return UploadCtrlModule;
});
