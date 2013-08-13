define('bootstrap', ['angular', 'app'], function (angular, app) {
    "use strict";
    
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