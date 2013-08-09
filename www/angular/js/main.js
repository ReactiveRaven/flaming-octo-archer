"use strict";

require.config({
	paths: {
		angular: '/bower_components/angular/angular',
        angularCookies: '/bower_components/angular-cookies/angular-cookies',
        angularResource: '/bower_components/angular-resource/angular-resource.js',
        marked: '/bower_components/marked/js/marked',
        CornerCouch: '/bower_components/CornerCouch/angular-cornercouch',
	},
	baseUrl: '/angular/js',
	shim: {
        'angular' : {'exports': 'angular'},
        'angularCookies': {deps: ['angular']},
        'CornerCouch': {deps: ['angular']}
	},
	priority: [
		"angular"
	]
});

require([
	'angular',
	'app'
], function (angular, app) {
    angular.bootstrap(document, [app['name']]);
    
    var html = document.getElementsByTagName('html')[0];

    html.setAttribute('ng-app', app['name']);
    html.dataset.ngApp = app['name'];
    
    if (top !== window) {
        top.postMessage({
            type: 'apploaded'
        }, '*');
    }
});