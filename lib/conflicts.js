'use strict';
// require('time-require');

/**
 * Some of this borrowed from yeoman. The diff
 * comparison is from verb.
 *
 * TODO: Proper attribution/links forthcoming before release.
 */

var fs = require('fs');
var path = require('path');
var lazy = require('lazy-cache')(require);
var diff = lazy('diff');
var inquirer = lazy('inquirer');
var red = require('ansi-red');
var bold = require('ansi-bold');
var gray = require('ansi-gray');
var green = require('ansi-green');
var yellow = require('ansi-yellow');
var cyan = require('ansi-cyan');
var success = require('success-symbol');
var error = require('error-symbol');

var colors = {
  abort: red,
  diff: bold,
  force: yellow,
  write: green
};

/**
 * The Conflicts class is used when the `.write()` method
 * is called to detect potential conflicts between files.
 *
 * When a potential conflict is detected, the user is prompted
 * for feedback before continuing with the actual write.
 *
 * @param  {Object} `options` Pass `force:true` to always overwrite existing files.
 */

function Conflicts(options) {
  options = options || {};
  this.prompt = inquirer().createPromptModule();
  this.force = options.force === true;
}

/**
 * Detects potential conflict between an existing file and content about to be
 * written to disk:
 *
 * If a file already exists, we:
 *
 *   1. Try to read its contents from the file system
 *   2. Compare it with the provided content
 *   3. If identical, mark it as is and skip the check
 *   4. If diverged, prepare and show up the file detect menu
 *
 * @param  {Object} `file` File object with `path` and `contents` properties.
 * @param  {Function} `cb` The callback returns one of the following status strings: 'identical', 'create', 'skip', 'force'
 * @return {undefined}
 * @api public
 */

Conflicts.prototype.detect = function (file, cb) {
  var fp = file.dest;
  if (!fs.existsSync(fp)) {
    return cb('create');
  }
  if (this.force) {
    console.log(yellow(fp));
    return cb('force');
  }
  this.existing = this.existing || fs.readFileSync(fp, 'utf8');
  if (this.existing !== file.contents) {
    console.log(red(fp));
    return this.ask(file, cb);
  } else {
    console.log(cyan(fp));
    return cb('identical');
  }
};

/**
 * Show a diff comparison of the existing content versus the content
 * about to be written.
 *
 * @param  {String} `a`
 * @param  {String} `b`
 * @param  {String} method Optionally pass a specific method name from the [diff] library to use for the diff.
 * @return {String} Visual diff comparison.
 */

Conflicts.prototype.diff = function(a, b, method) {
  method = method || 'diffJson';
  diff()[method](a, b).forEach(function (res) {
    var color = gray;
    if (res.added) color = green;
    if (res.removed) color = red;
    process.stdout.write(color(res.value));
  });
  console.log('\n');
};

/**
 * Actual prompting logic
 *
 * @param {Object} `file`
 * @param {Function} `cb`
 */

Conflicts.prototype.ask = function (file, cb) {
  var fp = file.dest;

  var prompt = {
    name: 'action',
    type: 'expand',
    message: 'Overwrite ' + file.dest + '?',
    value: 'nothing',
    choices: [{
      key: 'n',
      name: 'do not overwrite',
      value: 'skip'
    }, {
      key: 'y',
      name: 'overwrite',
      value: 'write'
    }, {
      key: 'a',
      name: 'overwrite this and all others',
      value: 'force'
    }, {
      key: 'x',
      name: 'abort',
      value: 'abort'
    }, {
      key: 'd',
      name: 'diff comparison between the current and new:',
      value: 'diff'
    }]
  };

  this.prompt([prompt], function (answers) {
    var msg = answers.action;

    switch(answers.action) {
      case 'abort':
        msg = red(error) + ' Aborted. No action was taken.';
        console.log(msg);
        process.exit(0);

      case 'diff':
        this.existing = this.existing || fs.readFileSync(fp, 'utf8');
        this.diff(this.existing, file.contents.toString());
        return this.ask(file, cb);

      case 'force':
        this.force = true;
        break;

      case 'write':
        msg = green(success) + ' file written to';
        this.force = true;
        break;

      default: {
        msg = red(error) + red(' Aborted.') + ' No action was taken.';
        console.log(msg);
        process.exit(0);
      }
    }

    var rel = path.relative(process.cwd(), fp);
    console.log(msg, colors[answers.action](rel));
    return cb(answers.action);
  }.bind(this));
};

/**
 * Expose `Conflicts`
 */

module.exports = Conflicts;
