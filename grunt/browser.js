module.exports = {
  dist: {
    src: ['vendor/loader/loader.js', 'dist/<%= pkg.name %>.amd.js'],
    dest: 'dist/<%= pkg.name %>.js',
    options: {
      barename: '<%= pkg.name %>',
      namespace: 'Ember.OAuth2'
    }
  }
}
