(function () {
    "use strict";
    
    var tests = [], specMatcher = /\/specs\/.+\.js$/, file;

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
            angularResource: '/base/www/bower_components/angular-resource/angular-resource',
            marked: '/base/www/bower_components/marked/js/marked',
            CornerCouch: '/base/www/bower_components/CornerCouch/angular-cornercouch',
            world: '/base/tests/jasmine/conf/world'
        },
        baseUrl: '/base/www/angular/js',
        shim: {
            'angular' : {'exports': 'angular'},
            'angularMocks': {deps: ['angular'], 'exports': 'angular.mock'},
            'angularResource': {deps: ['angular'], 'exports': 'angular.resource'},
            'angularCookies': {deps: ['angular'], 'exports': 'angular.cookies'}
        },
        priority: [
            "angular"
        ]
    });

    require.onError = function (err) {
        console.log(err.requireType);
        console.log('modules: ' + err.requireModules);
        throw err;
    };

    require([
        'angular',
        'app',
        'angularMocks'
    ].concat(tests), function () {
        window.__karma__.start();
    });
})();