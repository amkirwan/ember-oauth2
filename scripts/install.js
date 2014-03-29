const fs = require("fs");
const UglifyJS = require("uglify-js");

fs.mkdir('./dist', function(err) {
  if (err) {
    console.log('./dist folder already exists');
  }  
});

// copy file
fs.readFile("./src/lib/ember.oauth2.js", function (err, data) {
  if (err) throw err;
  fs.writeFile("./dist/ember.oauth2.js", data, function(err, data) {
    if (err) throw err;
  });
});

// write minified version
var result = UglifyJS.minify("./src/lib/ember.oauth2.js");
fs.writeFile("./dist/ember.oauth2.min.js", result.code, function(err, data) {
  if (err) throw err;
});
