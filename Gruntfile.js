module.exports = function (grunt) {
    "use strict";
    
    var config = {
        files: {
        
            karma_types: ['cucumber', 'jasmine'],
            karma_library_files: [
                // include library files
                {pattern: './www/bower_components/angular/**/*.js', watched: false, included: true, served: true},
                {pattern: './www/bower_components/angular-*/**/*.js', watched: false, included: true, served: true},
                {pattern: './www/bower_components/CornerCouch/*.js', watched: false, included: false, served: true},
                {pattern: './www/bower_components/marked/**/*.js', watched: false, included: false, served: true}
            ],
            karma_app_files: [
                // application files
                {pattern: './www/angular/js/*.js', watched: true, included: false, served: true},
                {pattern: './www/angular/js/**/*.js', watched: true, included: false, served: true}
            ],

            karma_cucumber_library_files: [
                // karma-cucumberjs specific files
                {pattern: 'node_modules/karma-cucumberjs/vendor/*.css', watched: false, included: false, served: true},
                {pattern: 'node_modules/karma-cucumberjs/lib/adapter.js', watched: false, included: true, served: true}
            ],
            karma_cucumber_editable_files: [

                // template files
                {pattern: 'tests/cucumber/app.template', watched: true, included: false, served: true},

                // tests
                {pattern: 'tests/cucumber/features/support/world.js', watched: true, included: true, served: true},
                {pattern: 'tests/cucumber/features/**/*.feature', watched: true, included: false, served: true},
                {pattern: 'tests/cucumber/features/**/step_definitions/*.js', watched: true, included: true, served: true},
                
                // Config files
                {pattern: './Gruntfile.js', watched: true, included: false, served: false},
                {pattern: './tests/cucumber/conf/karma.conf.js', watched: true, included: false, served: false}
            ],

            karma_jasmine_library_files: [
                // karma-jasmine specific files
                {pattern: "./node_modules/karma/adapter/lib/jasmine.js", watched: false, included: true, served: true},
                {pattern: "./node_modules/karma/adapter/jasmine.js", watched: false, included: true, served: true},
                {pattern: "./node_modules/karma/adapter/lib/require.js", watched: false, included: true, served: true},
                {pattern: "./node_modules/karma/adapter/require.js", watched: false, included: true, served: true}
            ],
            karma_jasmine_editable_files: [

                // test files
                {pattern: './tests/jasmine/support/**/*.js', watched: true, included: false, served: true},
                {pattern: './tests/jasmine/specs/**/*.js',  watched: true, included: false, served: true},

                // Config files
                {pattern: './Gruntfile.js', watched: true, included: false, served: false},
                {pattern: './tests/jasmine/conf/test-main.js', watched: true, included: true, served: true},
                {pattern: './tests/jasmine/conf/karma.conf.js', watched: true, included: false, served: false}
            ],

            _combine: [
                {'to': 'karma_jasmine_files', 'from': ['karma_jasmine_library_files', 'karma_library_files', 'karma_app_files', 'karma_jasmine_editable_files']},
                {'to': 'karma_cucumber_files', 'from': ['karma_cucumber_library_files', 'karma_library_files', 'karma_app_files', 'karma_cucumber_editable_files']}
            ],
            _delete: [
                '_combine', 'karma_jasmine_library_files',
                'karma_jasmine_editable_files', 'karma_cucumber_library_files',
                'karma_cucumber_editable_files', 'karma_library_files',
                'karma_app_files', 'karma_types'
            ]
        },

        jshint: {
            all: '<%= files._js_all %>',
            options: {
                jshintrc: '.jshintrc'
            }
        },

        karma: {
            jasmine_once_all: {
                configFile: 'tests/jasmine/conf/karma.conf.js',
                singleRun: true,
                browsers: ['Chrome', 'Firefox', 'Safari'],
                files: '<%= files.karma_jasmine_files %>'
            },

            jasmine_once: {
                configFile: 'tests/jasmine/conf/karma.conf.js',
                singleRun: true,
                browsers: ['Chrome'],
                files: '<%= files.karma_jasmine_files %>'
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

            cucumber: {
                configFile: 'tests/cucumber/conf/karma.conf.js',
                singleRun: false,
                browsers: ['Chrome'],
                files: '<%= files.karma_cucumber_files %>'
            }
        },

        watch: {
            js: {
                files: '<%= files._js_all %>',
                tasks: ['default']
            },
            jasmine: {
                files: '<%= files.karma_jasmine_files %>',
                tasks: ['jasmine_once']
            },
            jshint: {
                files: '<%= files._js_all %>',
                tasks: ['jshint']
            },
            jslint: { // alias for 'jshint'
                files: '<%= files._js_all %>',
                tasks: ['jshint']
            },
            dev: {
                files: '<%= files._watchable_all %>',
                tasks: ['dev']
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
    
    grunt.initConfig(config);

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    
    // aliases
    grunt.registerTask('jslint', ['jshint']);

    grunt.registerTask('tests', ['jshint', 'karma:jasmine_once', 'karma:cuke_once']);
    grunt.registerTask('setup', ['bower:install', 'tests', 'build']);
    grunt.registerTask('build', []);
    grunt.registerTask('default', ['tests']);
    grunt.registerTask('dev', ['default', 'watch:dev']);
};