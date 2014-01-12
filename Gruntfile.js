module.exports = function(grunt) {
  'use strict';

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  var src = {
    dir: 'src/',
    lib: 'src/lib',
    spec: 'src/spec',
    dist: 'dist'
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    src: src,
    jasmine: {
      all: {
        src: '<%= src.lib %>/*.js',
        options: {
          specs: '<%= src.spec %>/*.spec.js',
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
          '<%= src.dist %>/ember.oauth2.min.js': ['<%= src.lib %>/*.js']
        }
      }
    },
    copy: {
      main: {
        files: [
          { expand: true, flatten: true, src: ['<%= src.lib %>/*.js'], dest: 'dist/' }
        ]
      }
    },
    jshint: {
      files: ['gruntfile.js', '<%= src.lib %>/*.js', '<%= src.spec %>/*.spec.js'],
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true
        }
      }
    },
    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        commit: true,
        commitFiles: ['package.json', 'bower.json', 'dist/*'],
        createTag: false,
        push: false
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'jasmine', 'uglify', 'copy']);
  grunt.registerTask('test', ['jasmine']);
  grunt.registerTask('build', ['uglify', 'copy']);
  grunt.registerTask('bumpReadme', function() {
    var package_version_reg = /([\'|\"]?version[\'|\"]?[ ]*:[ ]*[\'|\"]?)([\d||A-a|.|-]*)([\'|\"]?)/i;
    var packageJson = grunt.file.read('./package.json');
    var parsedVersion = package_version_reg.exec(packageJson)[2];

    var version_reg = /(Current Version: .*\[)([\d|.|-|a-z]+)(\].*\/v)([\d|.|-|a-z]+)(\).*)/i;

    var readme = grunt.file.read('./README.md');
    var content = readme.replace(version_reg, function(match, p1, p2, p3, p4, p5,  offset, string) {
      return  p1 + parsedVersion + p3 + parsedVersion + p5; 
    });
    grunt.file.write('./README.md', content);
  });
  grunt.registerTask('bumpPatch', ['bump-only:patch', 'bumpReadme', 'jshint', 'build']); 
  grunt.registerTask('bumpMinor', ['bump-only:minor', 'bumpReadme', 'jshint', 'build']); 
  grunt.registerTask('bumpMajor', ['bump-only:major', 'bumpReadme', 'jshint', 'build']); 

};
