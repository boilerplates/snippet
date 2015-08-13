'use strict';

// require('time-require');

var fs = require('fs');
var path = require('path');
var lazy = require('lazy-cache')(require);
lazy.inject = lazy('inject-snippet');
lazy.red = lazy('ansi-red');
lazy.green = lazy('ansi-green');
lazy.set = lazy('set-value');
lazy.get = lazy('get-value');
lazy.copy = lazy('copy');

lazy.clone = lazy('clone-deep');
lazy.visit = lazy('collection-visit');
lazy.detect = lazy('detect-conflicts');
lazy.rewrite = lazy('rewrite-ext');
lazy.write = lazy('write');

/**
 * Expose `utils`
 */

var utils = module.exports;

utils.clone = function cloneDeep() {
  var clone = lazy.clone();
  return clone.apply(clone, arguments);
};

utils.visit = function () {
  var visit = lazy.visit();
  return visit.apply(visit, arguments);
};

utils.detect = function () {
  var detect = lazy.detect();
  return detect.apply(detect, arguments);
};

utils.rewrite = function () {
  var rewrite = lazy.rewrite();
  return rewrite.apply(rewrite, arguments);
};

utils.write = function () {
  var write = lazy.write();
  return write.apply(write, arguments);
};

utils.writeSync = function () {
  var write = lazy.write();
  return write.sync.apply(write, arguments);
};

/**
 * Logging symbols
 */

utils.symbol = {
  success: require('success-symbol'),
  error: require('error-symbol'),
};

utils.bold = require('ansi-bold');

utils.append = function append(a, b) {
  a.read();
  b.read();
  b.content += a.content;
  return b.content;
};

utils.prepend = function prepend(a, b) {
  a.read();
  b.read();
  b.content = a.content + b.content;
  return b.content;
};

utils.inject = function injectSnippet(a, b, opts) {
  var inject = lazy.inject();
  a.read();
  b.read();
  return inject(b.content, a.content, opts);
};

utils.set = function setValue() {
  var set = lazy.set();
  return set.apply(set, arguments);
};

utils.get = function getValue() {
  var get = lazy.get();
  return get.apply(get, arguments);
};

utils.tryRequire = function tryRequire(fp) {
  try {
    return require(path.resolve(fp));
  } catch(err) {}
  return null;
};

utils.tryRead = function tryRead(fp) {
  try {
    return fs.readFileSync(path.resolve(fp));
  } catch(err) {}
  return null;
};

utils.error = function error() {
  var args = [].slice.call(arguments);
  var red = lazy.red();
  args.unshift(red(utils.symbol.error));
  console.log.apply(console, args);
  return this;
};

utils.success = function success() {
  var args = [].slice.call(arguments);
  var green = lazy.green();
  args.unshift(green(utils.symbol.success));
  console.log.apply(console, args);
  return this;
};

utils.copy = function copy(src, dest, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  try {
    opts = opts || {};
    var cwd = opts.cwd || process.cwd();
    src = path.resolve(cwd, src);
    var rs = fs.createReadStream(src);
    var ws = fs.createWriteStream(dest);
    rs.pipe(ws);
    cb();
  } catch(err) {
    cb(err);
    return;
  }
};
