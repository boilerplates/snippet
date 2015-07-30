'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var async = require('async');
var Readers = require('../lib/readers');
var readers = new Readers();

/**
 * async readers
 */

readers.register('buffer', function (fp, cb) {
  fs.readFile(fp, function (err, res) {
    if (err) return cb(err);
    cb(null, res);
  });
});

readers.register('file', function (fp, cb) {
  readers.fns.buffer(fp, function (err, buffer) {
    if (err) return cb(err);
    cb(null, buffer.toString());
  });
});

readers.register('glob', function (pattern, opts, cb) {
  glob(pattern, opts, cb);
});

readers.register('loop', function (pattern, opts, cb) {
  var fns = this.fns;

  fns.glob(pattern, opts, function (err, files) {
    if (err) return cb(err);

    async.reduce(files, {}, function (acc, fp, next) {
      fp = path.join((opts || {}).cwd, fp);
      fns.file(fp, function (err, str) {
        acc[fp] = str;
        next(null, acc);
      });
    }, cb);
  });
});

readers.read('loop', '*.js', {cwd: 'lib'}, function (err, res) {
  if (err) return console.error(err);
  console.log(arguments);
});
