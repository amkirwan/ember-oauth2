'use strict';

module.exports = function(grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  var package = {
    dir: 'packages/ember-oauth2'
    lib: 'packages/ember-oauth2/lib/*.js' 
    dist: 'dist'
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json');
    jasmine: {
      pivotal: {
        src: '<%= package.lib %>'
        options: {
          specs: '<%= package.dir %>/specs/*.spec.js' 
          helpers: '<%= package.dir %>/helpers/*.js'
        }
      }
    }
    uglify: {
      options: {
        // the banner is inserted at the top of the output
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
        //
      }
      dist: {
        files: {
          '<%= package.dist %>/<%= pkg.name %>.min.js': ['<%= package.lib %>']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.registerTask('default', ['jshint', 'uglify', 'jasmine']);
};
