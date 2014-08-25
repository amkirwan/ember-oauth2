module.exports = {
  env1: {
    options: {
      "framework": "jasmine2",
      "test_page": "tests/index.html",
      "launch_in_dev": ["PhantomJS", "Chrome"],
      "launch_in_ci": ["PhantomJS"] 
    }
  }
}
