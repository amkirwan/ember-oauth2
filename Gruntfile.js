'use strict';

module.exports = function(grunt) {
  var config = require('load-grunt-config')(grunt, {
    pattern: ['grunt-template-*', '!grunt-template-jasmine-requirejs']
  });

  grunt.loadTasks('grunt/tasks');

  config.pkg = grunt.file.readJSON('package.json'); 
  config.src = 'src/spec';
  config.spec = 'src/spec';

  grunt.registerTask('default', ['jshint', 'transpile:lib', 'concat', 'browser', 'uglify', 'testem']);
  grunt.registerTask('build', ['default']);

  grunt.registerTask('release:patch', ['jshint', 'versioner:bumpOnly:default:patch', 'build', 'jasmine', 'versioner:commitOnly:default']);
  grunt.registerTask('release:minor', ['jshint', 'versioner:bumpOnly:default:minor', 'build', 'jasmine', 'versioner:commitOnly:default']);
  grunt.registerTask('release:major', ['jshint', 'versioner:bumpOnly:default:major', 'build', 'jasmine', 'versioner:commitOnly:default']);
  grunt.registerTask('latest-build:git', ['jshint', 'versioner:bumpOnly:default:git', 'build', 'jasmine']);
  grunt.registerTask('release:npm', ['versioner:npmOnly:default']);


  grunt.initConfig(config);
}
