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
            './bower_components/jquery/dist/jquery.min.js',
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
        node: true,
        browser: true,
        esnext: true,
        bitwise: false,
        curly: false,
        eqeqeq: true,
        eqnull: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        undef: true,
        strict: false,
        trailing: false,
        smarttabs: true,
        globals: {
          Webapp: true,
          jQuery: true,
          Ember: true,
          Handlebars: true,
          DS: true,
          jQuery: true,
          console: true,
          module: true,
          Ember: true
        }
      }
    },

    versioner: {
      options: { branch: 'master' },
      default: {
        files: {
          './package.json': [ './package.json'], 
          './bower.json': ['./bower.json'], 
          './README.md': ['./README.md'], 
          './src/lib/ember.oauth2.js': ['./src/lib/ember.oauth2.js']
        }
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'jasmine', 'uglify', 'copy']);
  grunt.registerTask('test', ['jasmine']);
  grunt.registerTask('build', ['uglify', 'copy']);
  grunt.registerTask('release:patch', ['jshint', 'versioner:bumpOnly:default:patch', 'build', 'versioner:commitOnly:default']);
  grunt.registerTask('release:minor', ['jshint', 'versioner:bumpOnly:default:minor', 'build', 'versioner:commitOnly:default']);
  grunt.registerTask('release:major', ['jshint', 'versioner:bumpOnly:default:major', 'build', 'versioner:commitOnly:default']);

};
