/* globals module:false */

module.exports = function (grunt) {
    "use strict";
    
    var npmTasks = [
        'grunt-bower-task',
        'grunt-contrib-clean',
        'grunt-contrib-connect',
        'grunt-contrib-jshint',
        'grunt-contrib-requirejs',
        'grunt-contrib-watch',
        'grunt-cucumber',
        'grunt-env',
        'grunt-karma',
        'grunt-shell',
        'grunt-clear',
        'grunt-parallel',
        'grunt-wait'
    ];
    
    // "postinstall": "./node_modules/protractor/bin/install_selenium_standalone"
    
    var tasks = {
        'setup': ['shell:install_selenium', 'bower:install'],
        'build': ['requirejs'],
        'release': ['tests:unit', 'tests:acceptance'],
        
        
        'units': ['karma:jasmine_background', 'karma:e2e_background', 'watch:units'],
        'units:run': ['clear', 'parallel:units'],
        'units:delayed': ['wait:five', 'units'],
        'jasmine': ['karma:jasmine_background', 'watch:jasmine'],
        'jasmine:run': ['clear', 'karma:jasmine_background:run'],
        'e2e': ['karma:e2e_background', 'watch:e2e'],
        'e2e:run': ['clear', 'karma:e2e_background:run'],
        'cucumber': ['cucumber:run', 'watch:cucumber'],
        'cucumber:run': ['requirejs:compile', 'env:test', 'cucumberjs'],
        
        'server': ['connect:server'],
        'selenium': ['shell:selenium'],

        'default': ['jasmine']
    };
    
    var config = {
        files: {
        
            karma_types: ['cucumber', 'jasmine', 'e2e'],
            karma_library_files: [
                // include library files
                {pattern: './www/bower_components/angular/**/*.js', watched: false, included: false, served: true},
                {pattern: './www/bower_components/angular-*/**/*.js', watched: false, included: false, served: true},
                {pattern: './www/bower_components/CornerCouch/*.js', watched: false, included: false, served: true},
                {pattern: './www/bower_components/marked/**/*.js', watched: false, included: false, served: true}
            ],
            karma_app_files: [
                // application files
                {pattern: './www/angular/js/*.js', watched: true, included: false, served: true},
                {pattern: './www/angular/js/**/*.js', watched: true, included: false, served: true}
            ],

            // NOT USED IN KARMA ANYMORE!
            karma_cucumber_editable_files: [
                // tests
                {pattern: 'tests/cucumber/features/support/*', watched: true, included: true, served: true},
                {pattern: 'tests/cucumber/features/*.feature', watched: true, included: false, served: true},
                {pattern: 'tests/cucumber/features/step_definitions/*.js', watched: true, included: false, served: true},
                
                // Config files
                {pattern: './Gruntfile.js', watched: true, included: false, served: false}
            ],

            karma_jasmine_library_files: [
                // karma-jasmine specific files
                {pattern: "./node_modules/karma-jasmine/lib/jasmine.js", watched: false, included: true, served: true},
                {pattern: "./node_modules/karma-jasmine/lib/adapter.js", watched: false, included: true, served: true},
                {pattern: "./node_modules/karma-requirejs/lib/require.js", watched: false, included: true, served: true},
                {pattern: "./node_modules/karma-requirejs/lib/adapter.js", watched: false, included: true, served: true}
            ],
            karma_jasmine_editable_files: [

                // test files
                {pattern: './tests/jasmine/support/**/*.js', watched: true, included: false, served: true},
                {pattern: './tests/jasmine/specs/**/*.js',  watched: true, included: false, served: true},

                // Config files
                {pattern: './Gruntfile.js', watched: true, included: false, served: false},
                {pattern: './tests/jasmine/conf/test-main.js', watched: true, included: true, served: true},
                {pattern: './tests/jasmine/conf/world.js', watched: true, included: false, served: true},
                {pattern: './tests/jasmine/conf/karma.conf.js', watched: true, included: false, served: false}
            ],

            karma_e2e_library_files: [
                // karma-jasmine specific files
                
                {pattern: "./node_modules/karma-ng-scenario/lib/angular-scenario.js", watched: false, included: true, served: true},
                {pattern: "./tests/e2e/conf/angular-scenario-requirejs-fix.js", watched: true, included: true, served: true},
                {pattern: "./node_modules/karma-ng-scenario/lib/adapter.js", watched: false, included: true, served: true},
                {pattern: "./node_modules/karma-requirejs/lib/require.js", watched: false, included: true, served: true},
                {pattern: "./node_modules/karma-requirejs/lib/adapter.js", watched: false, included: true, served: true}
            ],
            karma_e2e_editable_files: [

                // test files
                {pattern: './tests/e2e/support/**/*.js', watched: true, included: false, served: true},
                {pattern: './tests/e2e/scenarios/**/*.js',  watched: true, included: false, served: true},

                // Config files
                {pattern: './Gruntfile.js', watched: true, included: false, served: false},
                {pattern: './tests/e2e/conf/test-main.js', watched: true, included: true, served: true},
                {pattern: './tests/e2e/conf/world.js', watched: true, included: false, served: true},
                {pattern: './tests/e2e/conf/karma.conf.js', watched: true, included: false, served: false},
                
                // Templates
                {pattern: './www/angular/templates/**/*.html', watched: true, included: false, served: false},
                {pattern: './www/angular/templates/*.html', watched: true, included: false, served: false}
            ],
                    
            

            _combine: [
                {'to': 'karma_jasmine_files', 'from': ['karma_jasmine_library_files', 'karma_library_files', 'karma_app_files', 'karma_jasmine_editable_files']},
                {'to': 'karma_e2e_files', 'from': ['karma_e2e_library_files', 'karma_library_files', 'karma_app_files', 'karma_e2e_editable_files']},
                {'to': 'karma_cucumber_files', 'from': ['karma_cucumber_library_files', 'karma_library_files', 'karma_app_files', 'karma_cucumber_editable_files']}
            ],
            _delete: [
                '_combine', 'karma_jasmine_library_files',
                'karma_jasmine_editable_files', 'karma_cucumber_library_files',
                'karma_cucumber_editable_files', 'karma_library_files',
                'karma_app_files', 'karma_types', 'karma_e2e_library_files',
                'karma_e2e_editable_files'
            ]
        },

        jshint: {
            all: '<%= files._js_all %>',
            options: {
                jshintrc: '.jshintrc',
                ignores: ['www/angular/js/compiled.js', 'www/angular/js/compressed.js']
            }
        },
                
        parallel: {
            units: {
                tasks: [{
                    grunt: true,
                    args: ['karma:jasmine_background:run']
                }, {
                    grunt: true,
                    args: ['karma:e2e_background:run']
                }, {
                    grunt: true,
                    args: ['jshint']
                }]
            },
            tests: {
                tasks: ['connect', 'selenium', 'units:delayed'],
                options: {
                    stream: true,
                    grunt: true
                }
            }
        },
                
        wait: {
            five: {
                options: {
                    delay: 5000
                }
            }
        },

        karma: {

            jasmine_once: {
                configFile: 'tests/jasmine/conf/karma.conf.js',
                singleRun: true,
                browsers: ['Chrome'],
                files: '<%= files.karma_jasmine_files %>'
            },
            
            jasmine_background: {
                configFile: 'tests/jasmine/conf/karma.conf.js',
                singleRun: false,
                browsers: ['Chrome'],
                files: '<%= files.karma_jasmine_files %>',
                background: true,
                runnerPort: 9601,
                port: 9876
            },
            
            jasmine: {
                configFile: 'tests/jasmine/conf/karma.conf.js',
                singleRun: false,
                browsers: ['Chrome'],
                files: '<%= files.karma_jasmine_files %>'
            },

            cuke_once: {
                configFile: 'tests/cucumber/conf/karma.conf.js',
                singleRun: true,
                browsers: ['Chrome'],
                files: '<%= files.karma_cucumber_files %>'
            },
            
            e2e_background: {
                configFile: 'tests/e2e/conf/karma.conf.js',
                singleRun: false,
                browsers: ['Chrome'],
                files: '<%= files.karma_e2e_files %>',
                background: true,
                runnerPort: 9100,
                port: 9876
            },
            
            e2e: {
                configFile: 'tests/e2e/conf/karma.conf.js',
                singleRun: false,
                browsers: ['Chrome'],
                files: '<%= files.karma_e2e_files %>'
            },
            
            e2e_once: {
                configFile: 'tests/e2e/conf/karma.conf.js',
                singleRun: true,
                browsers: ['Chrome'],
                files: '<%= files.karma_e2e_files %>'
            }
        },

        watch: {
            js: {
                files: '<%= files._js_all %>',
                tasks: ['default']
            },
            units: {
                files: '<%= files._watchable_all %>',
                tasks: ['units:run']
            },
            jasmine: {
                files: '<%= files._watchable_jasmine %>',
                tasks: ['jasmine:run']
            },
            e2e: {
                files: '<%= files._watchable_e2e %>',
                tasks: ['e2e:run']
            },
            cucumber: {
                files: '<%= files._watchable_cucumber %>',
                tasks: ['cucumber:run']
            },
            jshint: {
                files: '<%= files._js_all %>',
                tasks: ['jshint']
            },
            dev: {
                files: '<%= files._watchable_all %>',
                tasks: ['tests:unit']
            },
            tests_unit: {
                files: '<%= files._watchable_all %>',
                tasks: ['tests:unit:run']
            }
        },
    
        bower: {
            install: {
                options: {
                    targetDir: './www/bower_components',
                    cleanup: true,
                    verbose: true,
                    layout: "byComponent"
                }
            }
        },
    
        uglify: {
            my_target: {
                files: {
                    'dest/output.min.js': ['src/input.js']
                }
            }
        },
                
        connect: {
            server: {
                options: {
                    keepalive: true,
                    port: 9001,
                    base: 'www'
                }
            }
        },
                
        env: {
            test: {
                PATH: '#{seleniumPath}:process.env.PATH'
            }
        },
        
        shell: {
            install_selenium: {
                command: './node_modules/protractor/bin/install_selenium_standalone',
                options: {
                    stdout: true,
                    stderr: true
                }
            },
            selenium: {
                command: 'java -jar selenium/selenium-server-standalone-*.jar -Dwebdriver.chrome.driver=./selenium/chromedriver',
                options: {
                    stdout: true,
                    stderr: true
                }
            },
            reinstall: {
                command: 'rm -rf selenium && rm -rf www/bower_components && rm -rf node_modules && npm install;',
                options: {
                    stdout: true,
                    stderr: true
                }
            }
        },
                
        cucumberjs: {
            files: 'tests/cucumber/features/**/*.feature',
            options: {
                format: 'progress'
            }
        },
                
        requirejs: {
            compile: {
                options: {
                    name: "bootstrap",
                    optimize: "none",
                    baseUrl: "./www/angular/js",
                    out: "./www/angular/js/compiled.js",
                    priority: [
                        'angular'
                    ],
                    paths: {
                        angular: '../../bower_components/angular/angular',
                        requirejs: '../../bower_components/requirejs/require',
                        angularMocks: '../../bower_components/angular-mocks/angular-mocks',
                        angularCookies: '../../bower_components/angular-cookies/angular-cookies',
                        angularResource: '../../bower_components/angular-resource/angular-resource',
                        marked: '../../bower_components/marked/js/marked',
                        CornerCouch: '../../bower_components/CornerCouch/angular-cornercouch'
                    },
                    shim: {
                        'angular' : {'exports': 'angular'},
                        'angularCookies': {deps: ['angular']},
                        'CornerCouch': {deps: ['angular']}
                    }
                }
            },
            compress: {
                options: {
                    name: "bootstrap",
                    baseUrl: "./www/angular/js",
                    out: "./www/angular/js/compressed.js",
                    priority: [
                        'angular'
                    ],
                    paths: {
                        angular: '../../bower_components/angular/angular',
                        requirejs: '../../bower_components/requirejs/require',
                        angularMocks: '../../bower_components/angular-mocks/angular-mocks',
                        angularCookies: '../../bower_components/angular-cookies/angular-cookies',
                        angularResource: '../../bower_components/angular-resource/angular-resource',
                        marked: '../../bower_components/marked/js/marked',
                        CornerCouch: '../../bower_components/CornerCouch/angular-cornercouch'
                    },
                    shim: {
                        'angular' : {'exports': 'angular'},
                        'angularCookies': {deps: ['angular']},
                        'CornerCouch': {deps: ['angular']}
                    }
                }
            }
        }

    };
    
    
    var files = config.files;
    
    files._watchable_all = [];
    files._js_all = [];
    
    (function () {
        
        // KARMA SETUP
        (function () {
            for (var i = 0; i < files.karma_types.length; i++) {
                var curType = files.karma_types[i];
                var patterns = files.karma_app_files.concat(files["karma_" + curType + "_editable_files"]);
                var curTypeWatchable = "_watchable_" + curType + "";
                var curTypeJs = "_js_" + curType + "";
                files[curTypeWatchable] = [];
                files[curTypeJs] = [];

                for (var j = 0; j < patterns.length; j++) {
                    var pattern = patterns[j].pattern;
                    files._watchable_all.push(pattern);
                    files[curTypeWatchable].push(pattern);
                    if (/\.js$/.test(pattern)) {
                        files._js_all.push(pattern);
                        files[curTypeJs].push(pattern);
                    }
                }
            }
        })();
        
        // COMBINE ARRAYS TOGETHER
        (function () {
            for (var i = 0; i < files._combine.length; i++) {
                var current = files._combine[i];
                files[current.to] = [];
                for (var j = 0; j < current.from.length; j++) {
                    files[current.to] = files[current.to].concat(files[current.from[j]]);
                }
            }
        })();
        
        // DELETE USELESS ARRAYS
        (function () {
            for (var i = 0; i < files._delete.length; i++) {
                delete files[files._delete[i]];
            }
            delete files._delete;
        })();
    })();
    
    config.files = files;
    
    // PASS IN CONFIG
    grunt.initConfig(config);
    
    // LOAD NPM TASKS
    (function () {
        var index;
    
        for (index in npmTasks) {
            grunt.loadNpmTasks(npmTasks[index]);
        }
    })();
    
    // DEFINE CUSTOM TASKS
    (function () {
        var taskName;
    
        for (taskName in tasks) {
            grunt.registerTask(taskName, tasks[taskName]);
        }
    })();
};
