module.exports = {
  lib: {
    moduleName: 'ember-oauth2',
    type: "amd",
    files: [{
      expand: true,
      src: ['lib/ember-oauth2.js'],
      dest: 'tmp/transpile/lib',
      ext: '.amd.js'
    }]
  },
}
