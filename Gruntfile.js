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
        banner: '/** <%= pkg.name %> | @version <%= pkg.version %> | <%= grunt.template.today("dd-mm-yyyy") %> */\n'
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
          module: true
        }
      },
      gruntfile: ['gruntfile.js'],
      lib: {
        options: {
          globals: {
            jQuery: true,
            Ember: true
          }
        },
        files: {
          src: ['<%= src.lib %>/*.js']
        }
      },
      spec: {
        options: {
          globals: {
            describe: true,
            beforeEach: true,
            afterEach: true,
            App: true,
            it: true,
            expect: true,
            sinon: true,
            Ember: true,
            $: true
          }
        },
        files: {
          src: ['<%= src.spec %>/*.spec.js']
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
          './yuidoc.json': ['./yuidoc.json'],
          './src/lib/ember.oauth2.js': ['./src/lib/ember.oauth2.js']
        }
      }
    },
    shell: {
      addDist: {
        command: 'git add --force dist'
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'jasmine', 'uglify', 'copy']);
  grunt.registerTask('test', ['jshint', 'jasmine']);
  grunt.registerTask('build', ['jshint', 'uglify', 'copy']);
  grunt.registerTask('release:patch', ['jshint', 'versioner:bumpOnly:default:patch', 'build', 'jasmine', 'shell:addDist', 'versioner:commitOnly:default']);
  grunt.registerTask('release:minor', ['jshint', 'versioner:bumpOnly:default:minor', 'build', 'jasmine', 'shell:addDist', 'versioner:commitOnly:default']);
  grunt.registerTask('release:major', ['jshint', 'versioner:bumpOnly:default:major', 'build', 'jasmine', 'shell:addDist', 'versioner:commitOnly:default']);
  grunt.registerTask('latest-build:git', ['jshint', 'versioner:bumpOnly:default:git', 'build', 'jasmine']);
  grunt.registerTask('release:npm', ['versioner:npmOnly:default']);

};
