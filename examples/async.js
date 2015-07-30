'use strict';

var fs = require('fs');
var Readers = require('../lib/readers');
var readers = new Readers();

/**
 * async readers
 */

readers.register('buffer', function (fp, cb) {
  return fs.readFile(fp, function (err, res) {
    if (err) return cb(err);
    cb(null, res);
  });
});

readers.register('file', function (fp, cb) {
  return this.fns.buffer(fp, function (err, buffer) {
    if (err) return cb(err);

    cb(null, buffer.toString());
  })
});

readers.register('a', function (fp, cb) {
  return this.fns.file(fp, function (err, res) {
    if (err) return cb(err);
    return cb(null, res + '\naaa');
  });
});

readers.register('b', function (fp, cb) {
  return this.fns.a(fp, function (err, res) {
    if (err) return cb(err);
    return cb(null, res + '\nbbb');
  });
});

readers.register('c', function (fp, cb) {
  this.fns.b(fp, function (err, res) {
    if (err) return cb(err);
    return cb(null, res + '\nccc');
  });
  return this;
});

readers.read('c', '.verb.md', function (err, res) {
  if (err) return console.error(err);
  console.log(res);
});


// var thisArg = readers.read('c', '.verb.md', function (err, res) {
//   console.log(res);
// });

// console.log(thisArg);
