module.exports = function(grunt) {
  'use strict';

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  var packages = {
    dir: 'packages/ember-oauth2',
    lib: 'packages/ember-oauth2/lib',
    spec: 'packages/ember-oauth2/spec',
    dist: 'dist'
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    packages: packages,
    jasmine: {
      all: {
        src: '<%= packages.lib %>/*.js',
        options: {
          specs: '<%= packages.spec %>/*.spec.js',
          vendor: [
            './bower_components/jquery/jquery.min.js',
            './bower_components/handlebars/handlebars.min.js',
            './bower_components/ember/ember.min.js',
            './bower_components/sinonjs/sinon.js'
          ]
        }
      }
    },
    uglify: {
      options: {
        // the banner is inserted at the top of the output
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
        //
      },
      dist: {
        files: {
          '<%= packages.dist %>/<%= pkg.name %>.min.js': ['<%= packages.lib %>/*.js']
        }
      }
    },
    copy: {
      main: {
        files: [
          { expand: true, flatten: true, src: ['./packages/ember-oauth2/lib/*.js'], dest: 'dist/' }
        ]
      }
    },
    jshint: {
      files: ['gruntfile.js', '<%= packages.lib %>/*.js', '<%= packages.spec %>/*.spec.js'],
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true
        }
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'jasmine', 'uglify']);
  grunt.registerTask('build', ['uglify', 'copy']);
};
