define('startup', ['angular', 'app', 'angularMocks'], function (angular, app) {
    "use strict";
    
    return function () {
        
        var _console = console;
        
        if (window.e2emocks) {
            _console.log("RUNNING MOCKED");
            var App = angular.module('commissar_mocked', ['commissar', 'ngMockE2E']);
            App.run(function ($httpBackend) {
                $httpBackend.whenGET('/couchdb/_all_dbs').respond(200, ['_replicator', '_users', 'commissar', 'commissar_user_john', 'commissar_validation_global', 'commissar_validation_users']);
                $httpBackend.whenPOST('/server/register.php').respond(200, {"ok": true});
                $httpBackend.whenPOST('/couchdb/_session').respond(200, {ok: true, userCtx: {name: 'a_new_username', roles: []}, info: {authentication_db: "_users", authentication_handlers: ["oauth", "cookie", "default"]}});
                $httpBackend.whenGET(/templates/).passThrough();
                
                $httpBackend.whenGET(/.*/).respond(404, "NOT SET UP IN E2EMOCKS YET");
            });

            app = App;
        }
        
                    
        var html = document.getElementsByTagName('html')[0];

        html.setAttribute('ng-app', app['name']);
        html.dataset.ngApp = app['name'];

        if (top !== window) {
            top.postMessage({
                type: 'apploaded'
            }, '*');
            _console.log("Posted message!")
        }
        
        angular.bootstrap(document, [app['name']]);
    };
});