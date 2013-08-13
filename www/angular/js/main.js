"use strict";

require.config({
	paths: {
		angular: '/bower_components/angular/angular',
        angularCookies: '/bower_components/angular-cookies/angular-cookies',
        angularMocks: '/bower_components/angular-mocks/angular-mocks',
        angularResource: '/bower_components/angular-resource/angular-resource',
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
    'bootstrap'
], function (bootstrap) {
    // All handled in 'bootstrap'
    bootstrap();
});