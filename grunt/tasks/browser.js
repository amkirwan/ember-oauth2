module.exports = function(grunt) {

  grunt.registerMultiTask('browser', "Export a module to the window", function() {
    var opts = this.options();
    this.files.forEach(function(f) {
      var output = ["(function(globals) {"];

      output.push.apply(output, f.src.map(grunt.file.read));

      output.push('\n/*global define, Ember */\ndefine("ember", [], function() {\n\t"use strict";\n\treturn { "default": Ember };\n });\n');

      output.push(grunt.template.process(
        'window.<%= namespace %> = requireModule("<%= barename %>")["default"];', { 
        data: {
          namespace: opts.namespace,
          barename: opts.barename
        }
      }));
      output.push('})(window);');
   
      grunt.file.write(f.dest, grunt.template.process(output.join("\n")));
    });
  });
};
