'use strict';

module.exports = function(grunt) {
  var config = require('load-grunt-config')(grunt, {
    pattern: ['grunt-template-*', '!grunt-template-jasmine-requirejs']
  });

  grunt.loadTasks('grunt/tasks');

  config.pkg = grunt.file.readJSON('package.json'); 
  config.src = 'src/spec';
  config.spec = 'src/spec';

  grunt.registerTask('default', ['build', 'jshint:tests', 'preprocess:amd', 'testem']);
  grunt.registerTask('build', ['clean', 'jshint:lib', 'transpile:lib', 'concat', 'browser', 'uglify', 'jshint:dist']);

  grunt.registerTask('test-amd', ['default']);
  grunt.registerTask('test-global', ['build', 'jshint:tests', 'preprocess:global', 'testem']);

  grunt.registerTask('release:patch', ['jshint', 'versioner:bumpOnly:default:patch', 'build', 'jasmine', 'versioner:commitOnly:default']);
  grunt.registerTask('release:minor', ['jshint', 'versioner:bumpOnly:default:minor', 'build', 'jasmine', 'versioner:commitOnly:default']);
  grunt.registerTask('release:major', ['jshint', 'versioner:bumpOnly:default:major', 'build', 'jasmine', 'versioner:commitOnly:default']);
  grunt.registerTask('latest-build:git', ['jshint', 'versioner:bumpOnly:default:git', 'build', 'jasmine']);
  grunt.registerTask('release:npm', ['versioner:npmOnly:default']);


  grunt.initConfig(config);
}
