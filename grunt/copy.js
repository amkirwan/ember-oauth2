module.exports = {
  main: {
    files: [
      { expand: true, flatten: true, src: ['<%= src.lib %>/*.js'], dest: 'dist/' }
    ]
  }
}
