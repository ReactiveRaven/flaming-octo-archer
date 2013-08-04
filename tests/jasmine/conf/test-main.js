/* global requirejs:false */
"use strict";

var tests = [], specMatcher = /\/specs\/.+\.js$/, file;

for (file in window.__karma__.files) {
    if (specMatcher.test(file)) {
        tests.push(file);
    }
}

//requirejs.config({
//    // Karma serves files from '/base'
//    baseUrl: '/base',
//
//    paths: {
//    },
//
//    shim: {
//    },
//
//    // ask Require.js to load these files (all our tests)
//    deps: tests,
//
//    // start test run, once Require.js is done
//    callback: window.__karma__.start
//});

require.config({
	paths: {
		angular: '/base/www/bower_components/angular/angular',
		angularMocks: '/base/www/bower_components/angular-mocks/angular-mocks',
		marked: '/base/www/bower_components/marked/js/marked',
        CornerCouch: '/base/www/bower_components/CornerCouch/angular-cornercouch'
		//text: 'lib/require/text',

	},
	baseUrl: '/base/www/angular/js',
	shim: {
		'angular' : {'exports': 'angular'},
		'angularMocks': {deps: ['angular'], 'exports': 'angular.mock'}
	},
	priority: [
		"angular"
	]
});

requirejs.onError = function (err) {
    console.log(err.requireType);
    console.log('modules: ' + err.requireModules);
    throw err;
};

require([
	'angular',
	'app',
	'angularMocks',
].concat(tests), function () {
    window.__karma__.start();
});