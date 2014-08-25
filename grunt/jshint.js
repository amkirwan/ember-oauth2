module.exports = {
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
        src: ['lib/**/*.js']
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
        src: ['tests/*.spec.js']
      }
    }
  },
  dist: {
    options: {
      globals: {
      },
    }
  }
}
