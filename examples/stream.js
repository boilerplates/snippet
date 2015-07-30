'use strict';

var fs = require('fs');
var path = require('path');
var mkdir = require('mkdirp');
var success = require('success-symbol');
var green = require('ansi-green');
var bold = require('ansi-bold');
var Readers = require('../lib/readers');
var Writers = require('../lib/writers');

// instantiate
var readers = new Readers();
var writers = new Writers();


/**
 * stream reader
 */

readers.register('file', function (fp) {
  return fs.createReadStream(fp);
});

/**
 * stream writer
 */

writers.register('stream', function (dest) {
  return fs.createWriteStream(dest);
});

writers.register('file', function (dest) {
  var dir = path.dirname(dest);
  if (!fs.existsSync(dir)) mkdir.sync(dir);
  var res = this.fns.stream(dest);
  console.log(green(success), 'file written to', bold(dest));
  return res;
});

/**
 * combined
 */

readers.read('file', 'LICENSE')
  .pipe(writers.write('file', 'examples/output/LICENSE'))
