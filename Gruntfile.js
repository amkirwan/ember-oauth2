'use strict';

module.exports = function(grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  var packages = {
    dir: 'packages/ember-oauth2',
    lib: 'packages/ember-oauth2/lib/*.js',
    dist: 'dist'
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    packages: packages,
    jasmine: {
      pivotal: {
        src: '<%= packages.lib %>',
        options: {
          specs: '<%= packages.dir %>/spec/*.spec.js',
          template: '<%= packages.dir %>/spec/SpecRunner.html'
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
          '<%= packages.dist %>/<%= pkg.name %>.min.js': ['<%= packages.lib %>']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.registerTask('default', ['jshint', 'uglify', 'jasmine']);
};
