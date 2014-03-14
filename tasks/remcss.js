/*
 * remcss
 *
 *
 * Copyright (c) 2014 Mindaugas Murauskas
 * Licensed under the MIT license.
 */

module.exports = function (grunt) {

  'use strict';

  var fs = require('fs'),
      _ = require('underscore'),
      parse = require('css-parse'),
      stringify = require('css-stringify');

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('remcss', 'Semi-automated tool for removing unused css.', function () {

    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      punctuation: '.',
      separator: ', ',
      audits: [],
      ignore: []
    });

    var audits = [],
        selectorsToRemove = [],
        selectorsToIgnore = [];

    options.audits.forEach(function (auditFile) {
      audits.push(fs.readFileSync(auditFile).toString().split("\r\n"));
    });

    selectorsToRemove = _.intersection.apply(this, audits);

    _(options.ignore).each(function(ignored) {

      _(selectorsToRemove).each(function (selector) {
        if (selector.indexOf(ignored) >= 0) {
          selectorsToIgnore.push(selector);
        }
      });

    });

    selectorsToRemove = _.difference(selectorsToRemove, selectorsToIgnore);

    // Iterate over all specified file groups.
    this.files.forEach(function (file) {

      var src = file.src.filter(function (filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        }

        return true;

      });

      var css = grunt.file.read(src[0]),//fs.readFileSync(src[0]).toString().split('\r\n').join(''),
          parsedCss = parse(css),
          rulesToKeep = [];


      _(parsedCss.stylesheet.rules).each(function (rule) {
        if (rule.type !== 'rule') {
            return;
        }

        var selector = rule.selectors.join(', ');

        if (_.indexOf(selectorsToRemove, selector) === -1) {
            rulesToKeep.push(rule);
        }
      });

      parsedCss.stylesheet.rules = rulesToKeep;

      grunt.file.write(file.dest, stringify(parsedCss));

      grunt.log.writeln('File ' + file.dest + ' created.');
    });


  });

};
