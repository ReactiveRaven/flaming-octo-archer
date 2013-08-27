(function () {
    "use strict";

    var tests = [],
        specMatcher = /\/scenarios\/.+\.js$/, file;

    for (file in window.__karma__.files) {
        if (specMatcher.test(file)) {
            tests.push(file);
        }
    }

    require.config({
        baseUrl: '/base/www/angular/js',
        deps: tests,
        callback: window.__karma__.start
    });

    require.onError = function (err) {
        console.log(err.requireType);
        console.log('modules: ' + err.requireModules);
        throw err;
    };
})();