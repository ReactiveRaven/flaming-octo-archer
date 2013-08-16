define('bootstrap', ['angular', 'app', 'angularMocks'], function (angular, app) {
    "use strict";
    
    return function () {
        
        if (window.e2emocks) {
            console.log("RUNNING MOCKED");
            var App = angular.module('commissar_mocked', ['commissar', 'ngMockE2E']);
            App.run(function ($httpBackend) {
                $httpBackend.whenGET('/couchdb/_all_dbs').respond(200, ['_replicator', '_users', 'commissar', 'commissar_user_fish', 'commissar_user_geraldine', 'commissar_validation_global', 'commissar_validation_users']);
                $httpBackend.whenPOST('/server/register').respond(200, {"ok": true});
                $httpBackend.whenGET(/templates/).passThrough();
                $httpBackend.whenGET(/.*/).respond(404, "NOT SET UP IN E2EMOCKS YET");
            });

            app = App;
        }
        
        angular.bootstrap(document, [app['name']]);

        var html = document.getElementsByTagName('html')[0];

        html.setAttribute('ng-app', app['name']);
        html.dataset.ngApp = app['name'];

        if (top !== window) {
            top.postMessage({
                type: 'apploaded'
            }, '*');
        }
    };
});