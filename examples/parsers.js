'use strict';

var fs = require('fs');
var path = require('path');
var success = require('success-symbol');
var green = require('ansi-green');
var bold = require('ansi-bold');
var mkdir = require('mkdirp');
var Base = require('../lib/base');

function Readers(options) {
  this.base = new Base('readers', options);
}
Readers.prototype.register = function(key) {
  this.base.register.apply(this.base, arguments);
  return this;
};
Readers.prototype.read = function(key) {
  return this.base.run.apply(this.base, arguments);
};

function Writers(options) {
  this.base = new Base('writers', options);
}
Writers.prototype.register = function() {
  this.base.register.apply(this.base, arguments);
  return this;
};
Writers.prototype.write = function() {
  return this.base.run.apply(this.base, arguments);
};

function Parsers(options) {
  this.base = new Base('writers', options);
}
Parsers.prototype.register = function() {
  this.base.register.apply(this.base, arguments);
  return this;
};
Parsers.prototype.parse = function() {
  return this.base.run.apply(this.base, arguments);
};


var readers = new Readers();
var parsers = new Parsers();
var writers = new Writers({cwd: 'examples/output'});


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
