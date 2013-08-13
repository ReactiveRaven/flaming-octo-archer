define('bootstrap', ['angular', 'app', 'appmocked'], function (angular, app, appmocked) {
    "use strict";
    
    if (typeof window.e2emocks !== 'undefined') {
        app = appmocked;
    }
    
    return function () {
        
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