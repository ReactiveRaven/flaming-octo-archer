"use strict";

require.config({
    paths: {
        angular: '/bower_components/angular/angular',
        angularCookies: '/bower_components/angular-cookies/angular-cookies',
        angularMocks: '/bower_components/angular-mocks/angular-mocks',
        angularResource: '/bower_components/angular-resource/angular-resource',
        marked: '/bower_components/marked/js/marked',
        CornerCouch: '/bower_components/CornerCouch/angular-cornercouch',
        jquery: '/bower_components/jquery/jquery',
        bootstrap: '/bower_components/bootstrap/bootstrap',
        ngUpload: '/bower_components/ngUpload/ng-upload',
        'angular-moment': '/bower_components/angular-moment/angular-moment',
        moment: '/bower_components/moment/moment'
    },
    baseUrl: '/angular/js',
    shim: {
        jquery: {exports: '$'},
        bootstrap: {deps: ['jquery']}
    },
    priority: [
    ]
});

require([
    'startup'
], function (startup) {
    // All handled in 'startup'
    startup();
});