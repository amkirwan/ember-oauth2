module.exports = {
  options: {
    // the banner is inserted at the top of the output
    banner: '/** <%= pkg.name %> | @version <%= pkg.version %> | <%= grunt.template.today("dd-mm-yyyy") %> */\n'
    //
  },
  dist: {
    files: {
      './dist/ember-oauth2.min.js': ['dist/ember-oauth2.js'],
      './dist/ember-oauth2.amd.min.js': ['dist/ember-oauth2.js']
    }
  }
}
