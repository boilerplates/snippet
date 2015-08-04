'use strict';

var fs = require('fs');
var path = require('path');
var success = require('success-symbol');
var green = require('ansi-green');
var bold = require('ansi-bold');
var mkdir = require('mkdirp');
var Fetch = require('fetch-files');
var Base = require('../lib/base');

function App(options) {
  Fetch.call(this, options);
  this.options = options || {};
  this.init(this.options);
}
Fetch.extend(App);

App.prototype.init = function(opts) {
  this.create('reader', 'read', opts);
  this.create('writer', 'write', opts);
  this.create('plugin', 'run', opts);
};

App.prototype.create = function(name, method, options) {
  var base = new Base(name, options);

  this.mixin(name, function(key) {
    base.register.apply(base, arguments);
    return this;
  });
  this.mixin(method, function(key) {
    return base.run.apply(base, arguments);
  });
};

App.prototype.mixin = function(name, fn) {
  App.prototype[name] = fn;
  return this;
};

var app = new App({cwd: '.', destBase: 'examples/output'});



/**
 * sync readers
 */

app.reader('file', function (fp) {
  return this.buffer(fp).toString();
});

app.reader('buffer', function (fp) {
  if (this.options.cwd) {
    fp = path.join(this.options.cwd, fp);
  }
  return fs.readFileSync(fp);
});

/**
 * sync plugins
 */

app.plugin('json', function (buffer) {
  return JSON.parse(buffer);
});

app.plugin('update', function (obj) {
  obj.foo = 'bar';
  return obj;
});

app.plugin('stringify', function (obj) {
  return JSON.stringify(obj, null, 2);
});

/**
 * sync writers
 */

app.writer('prep', function (dest) {
  if (this.options.destBase) {
    dest = path.join(this.options.destBase, dest);
  }
  var dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    mkdir.sync(dir);
  }
  return dest;
});

app.writer('dest', function (dest, contents) {
  fs.writeFileSync(this.prep(dest), contents);
  console.log(green(success), 'file written to', bold(dest));
});

var buffer = app.read('buffer', 'package.json');
var json = app.run('json', buffer);
var obj = app.run('update', json);
var pkg = app.run('stringify', obj);

app.write('dest', 'package.json', pkg);


/**
 * async readers
 */

app.reader('buffer', function (fp, cb) {
  return fs.readFile(fp, function (err, res) {
    if (err) return cb(err);
    cb(null, res);
  });
});

app.reader('file', function (fp, cb) {
  return this.buffer(fp, function (err, buffer) {
    if (err) return cb(err);

    cb(null, buffer.toString());
  })
});

/**
 * async plugins
 */

app.plugin('all-in-one', function (buffer, cb) {
  var json = this.json(buffer);
  var updated = this.update(json);
  cb(null, this.stringify(updated));
});


/**
 * async writers
 */


app.writer('prep', function (dest, cb) {
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

app.writer('dest', function (dest, contents, cb) {
  this.prep(dest, function (err, fp) {
    if (err) return cb(err);

    fs.writeFile(fp, contents, cb);
    console.log(green(success), 'file written to', bold(dest));
  });
});


app.read('file', 'package.json', function (err, res) {
  if (err) return console.error(err);
  console.log(res)

  app.run('all-in-one', res, function (err, str) {
    if (err) return console.error(err);

    app.write('dest', 'package.json', str, function (err) {
      if (err) return console.error(err);
    });
  })
});
