module.exports = {
  options: { 
    branch: 'master',
    mode: 'production'
  },
  default: {
    files: {
      './package.json': [ './package.json'], 
      './bower.json': ['./bower.json'], 
      './README.md': ['./README.md'], 
      './yuidoc.json': ['./yuidoc.json'],
      './lib/ember-oauth2.js': ['./lib/ember-oauth2.js']
    }
  }
}
