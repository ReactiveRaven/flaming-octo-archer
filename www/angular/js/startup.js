/* globals angular:false */
define(
    'startup',
    [
//        'angular',
        'app',
        'angularMocks'
    ],
    function (app) {
        "use strict";

        return function () {

            if (window.e2emocks) {
                console.log("RUNNING MOCKED");
                var mockedApp = angular.module('commissar_mocked', ['commissar', 'ngMockE2E']);
                mockedApp.run(function ($httpBackend) {
                    $httpBackend.whenGET('/couchdb/_all_dbs').respond(200, ['_replicator', '_users', 'commissar', 'commissar_user_john', 'commissar_validation_global', 'commissar_validation_users']);
                    $httpBackend.whenPOST('/server/register.php').respond(200, {"ok": true});
                    $httpBackend.whenGET('/couchdb/_session').respond(200, {ok: false, userCtx: {name: null, roles: []}, info: {authentication_db: "_users", authentication_handlers: ["oauth", "cookie", "default"]}});
                    $httpBackend.whenPOST('/couchdb/_session').respond(200, {ok: true, name: 'a_new_username', roles: ['+admin']});
                    $httpBackend.whenGET(/templates/).passThrough();

                    $httpBackend.whenGET(/.*/).respond(404, "NOT SET UP IN E2EMOCKS YET");
                });

                app = mockedApp;
            }


            var html = document.getElementsByTagName('html')[0];

            html.setAttribute('ng-app', app['name']);
            html.dataset.ngApp = app['name'];

            if (top !== window) {
                top.postMessage({
                    type: 'apploaded'
                }, '*');
                console.log("Posted message!");
            }
            
            if (window.useTemplateModule) {
                var templatedApp = angular.module('commissar_templated', [app['name']]);
                
                require(['/js/templates.min.js'], function (templates) {
                    templates(templatedApp);
                    angular.bootstrap(document, [templatedApp['name']]);
                });
            } else {
                console.log("RUNNING WITHOUT TEMPLATE MODULE");
                angular.bootstrap(document, [app['name']]);
            }

        };
    }
);