module.exports = {
  dist: {
    src: ['bower_components/loader.js/loader.js', 'dist/<%= pkg.name %>.amd.js'],
    dest: 'dist/<%= pkg.name %>.js',
    options: {
      barename: '<%= pkg.name %>',
      namespace: 'Ember.OAuth2'
    }
  }
}
