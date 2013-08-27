module.exports = function (config) {
    "use strict";
    
    config.set({
        basePath: './../../../',
        files: [
            'provided in Gruntfile.js'
        ],
        exclude: [
        ],
        reporters: ['progress'],
        port: 9876,
        runnerPort: 9100,
        colors: true,
        logLevel: config.LOG_WARN,
        autoWatch: true,
        browsers: ['Chrome'],
        captureTimeout: 60000,
        singleRun: false
    });
};