module.exports = {
  gruntfile: ['gruntfile.js'],
  options: { jshintrc: '.jshintrc'},
  lib: {
    src: ['lib/**/*.js'],
    options: { jshintrc: '.jshintrc'}
  },
  tests: {
    src: ['tests/**/*.spec.js'],
    options: { jshintrc: 'tests/.jshintrc'}
  },
  dist: {
    src: ['dist/ember-oauth2.js', 'dist/ember-oauth2.amd.js'],
    options: { jshintrc: '.jshintrc'}
  }
}
