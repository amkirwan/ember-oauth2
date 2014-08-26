module.exports = {
  global: {
    src: 'tests/test.html', dest: 'tmp/result/test.html',
    options: { context: { global: true, amd: false, tests: true } },
  },
  amd: {
    src: 'tests/test.html', dest: 'tmp/result/test.html',
    options: { context: { global: false, amd: true, tests: true } },

  }
}
