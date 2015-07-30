module.exports = {
  main: {
    files: [
      { expand: true, flatten: true, src: ['<%= lib %>/*.js'], dest: 'dist/' }
    ]
  }
}
