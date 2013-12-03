'use strict';

module.exports = function(grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  var package = {
    path: 'packages/ember-oauth2'
    dist: 'dist'
  }

  grunt.initConfig({
    jasmine: {
      pivotal: {
        src: '<%= package.path %>/lib/*.js'
        options: {
          specs: '<%= package.path %>/specs/*.spec.js' 
          helpers: '<%= package.path %>/helpers/*.js'
        }
      }
    }
  });
}
