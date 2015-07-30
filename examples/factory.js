'use strict';

var fs = require('fs');
var path = require('path');
var success = require('success-symbol');
var green = require('ansi-green');
var bold = require('ansi-bold');
var mkdir = require('mkdirp');
var Base = require('../lib/base');

function Factory(name, method, options) {
  function Ctor(options) {
    this.base = new Base(name, options);
  }
  Ctor.prototype.register = function(key) {
    this.base.register.apply(this.base, arguments);
    return this;
  };
  Ctor.prototype[method] = function(key) {
    return this.base.run.apply(this.base, arguments);
  };
  return new Ctor(options);
}

var readers = new Factory('readers', 'read');
var parsers = new Factory('parsers', 'parse');
var writers = new Factory('writers', 'write', {cwd: 'examples/output'});

/**
 * sync readers
 */

readers.register('file', function (fp) {
  return this.buffer(fp).toString();
});

readers.register('buffer', function (fp) {
  return fs.readFileSync(fp);
});

/**
 * sync parsers
 */

parsers.register('json', function (buffer) {
  return JSON.parse(buffer);
});

parsers.register('update', function (obj) {
  obj.foo = 'bar';
  return obj;
});

parsers.register('stringify', function (obj) {
  return JSON.stringify(obj, null, 2);
});

/**
 * sync writers
 */

writers.register('prep', function (dest) {
  if (this.options.cwd) {
    dest = path.join(this.options.cwd, dest);
  }
  var dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    mkdir.sync(dir);
  }
  return dest;
});

writers.register('dest', function (dest, contents) {
  fs.writeFileSync(this.prep(dest), contents);
  console.log(green(success), 'file written to', bold(dest));
});

// var buffer = readers.read('buffer', 'package.json');
// var json = parsers.parse('json', buffer);
// var obj = parsers.parse('update', json);
// var pkg = parsers.parse('stringify', obj);
// writers.write('dest', 'package.json', pkg);

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
  return this.buffer(fp, function (err, buffer) {
    if (err) return cb(err);

    cb(null, buffer.toString());
  })
});

/**
 * async parsers
 */

parsers.register('all-in-one', function (buffer, cb) {
  var json = this.json(buffer);
  var updated = this.update(json);
  cb(null, this.stringify(updated));
});


/**
 * async writers
 */


writers.register('prep', function (dest, cb) {
  if (this.options.cwd) {
    dest = path.join(this.options.cwd, dest);
  }

  var dir = path.dirname(dest);
  fs.exists(dir, function (exists) {
    if (exists) return cb(null, dest);

    mkdir(dir, function (err) {
      if (err) return cb(err);
      cb(null, dest);
    });
  });
});

writers.register('dest', function (dest, contents, cb) {
  this.prep(dest, function (err, fp) {
    if (err) return cb(err);

    fs.writeFile(fp, contents, cb);
    console.log(green(success), 'file written to', bold(dest));
  });
});


readers.read('file', 'package.json', function (err, res) {
  if (err) return console.error(err);

  parsers.parse('all-in-one', res, function (err, str) {
    if (err) return console.error(err);

    writers.write('dest', 'package.json', str, function (err) {
      if (err) return console.error(err);
    });
  })
});
