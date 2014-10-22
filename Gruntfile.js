module.exports = function(grunt) {
  'use strict';

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

  grunt.registerTask('norelease:patch', ['versioner:bumpOnly:default:patch', 'default']);
  grunt.registerTask('release:patch', ['versioner:bumpOnly:default:patch', 'default', 'versioner:commitOnly:default']);
  grunt.registerTask('release:minor', ['versioner:bumpOnly:default:minor', 'default', 'versioner:commitOnly:default']);
  grunt.registerTask('release:major', ['versioner:bumpOnly:default:major', 'default', 'versioner:commitOnly:default']);
  grunt.registerTask('latest-build:git', ['versioner:bumpOnly:default:git', 'default' ]);
  grunt.registerTask('release:npm', ['versioner:npmOnly:default']);

  grunt.initConfig(config);
};
