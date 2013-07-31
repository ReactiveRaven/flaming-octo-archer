module.exports = function (grunt) {
  grunt.initConfig({
    files: {
      karma_cucumber_files: [
        // karma-cucumberjs specific files
        {pattern: 'node_modules/karma-cucumberjs/vendor/*.css', watched: false, included: false, served: true},
        {pattern: 'node_modules/karma-cucumberjs/lib/adapter.js', watched: false, included: true, served: true},
        
        // template files
        {pattern: 'tests/cucumber/app.template', watched: true, included: false, served: true},

        // tests
        {pattern: 'tests/cucumber/features/support/world.js', watched: true, included: true, served: true},
        {pattern: 'tests/cucumber/features/**/*.feature', watched: true, included: false, served: true},
        {pattern: 'tests/cucumber/features/**/step_definitions/*.js', watched: true, included: true, served: true}

      ],

      jshint: ['webroot/js/**/*.js', 'features/**/*.js', 'Gruntfile.js'],

      watch_js: ['webroot/js/**/*.js', 'features/**/*.js', 'Gruntfile.js', 'features/**/*.feature']
    },

    jshint: {
      all: '<%= files.jshint %>',
      options: {
        jshintrc: '.jshintrc'
      }
    },

    karma: {
      jasmine: {
        configFile: 'karma.conf.js',
        singleRun: true,
        browsers: ['Chrome', 'Firefox', 'Safari']
      },

      cuke_once: {
        configFile: 'karma.conf.js',
        singleRun: true,
        browsers: ['Chrome'],
        files: '<%= files.karma_cucumber_files %>',
        acceptPending: true
      },

      cucumber: {
        configFile: 'karma.conf.js',
        singleRun: false,
        browsers: ['Chrome'],
        files: '<%= files.karma_cucumber_files %>'
      }
    },

    watch: {
      js: {
        files: '<%= files.watch_js %>',
        tasks: ['default']
      },
      dev: {
        files: '<%= files.watch_all %>',
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
    
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('tests', ['jshint', 'karma:cuke_once', 'karma:jasmine']);
  grunt.registerTask('setup', ['bower:install', 'build']);
  grunt.registerTask('build', []);
  grunt.registerTask('default', ['tests']);
  grunt.registerTask('dev', ['default', 'watch']);
};