(function () {
    "use strict";

    var tests = [], specMatcher = /\/scenarios\/.+\.js$/, file;

    for (file in window.__karma__.files) {
        if (specMatcher.test(file)) {
            tests.push(file);
        }
    }

    require.config({
        paths: {
            angular: '/base/www/bower_components/angular/angular',
            angularMocks: '/base/www/bower_components/angular-mocks/angular-mocks',
            angularCookies: '/base/www/bower_components/angular-cookies/angular-cookies',
            angularResource: '/base/www/bower_components/angular-resource/angular-resource.js',
            marked: '/base/www/bower_components/marked/js/marked',
            CornerCouch: '/base/www/bower_components/CornerCouch/angular-cornercouch',

            // not inside bower_components
            world: '/base/tests/e2e/conf/world',
            angularScenarioRequirejsFix: '/base/tests/e2e/conf/angular-scenario-requirejs-fix'
        },
        baseUrl: '/base/www/angular/js',
        shim: {
            'angular' : {'exports': 'angular'},
            'angularMocks': {deps: ['angular'], 'exports': 'angular.mock'},
            'angularCookies': {deps: ['angular']},
            'CornerCouch': {deps: ['angular']}
        },
        priority: [
            "angular"
        ],
        deps: [
            'angular',
            'angularMocks',
            'app'
        ].concat(tests),
        callback: function () {
            window.__karma__.start();
        }
    });

    require.onError = function (err) {
        console.log(err.requireType);
        console.log('modules: ' + err.requireModules);
        throw err;
    };
})();