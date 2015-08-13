'use strict';

// require('time-require');

var fs = require('fs');
var path = require('path');
var lazy = require('lazy-cache')(require);
lazy.red = lazy('ansi-red');
lazy.green = lazy('ansi-green');
lazy.set = lazy('set-value');
lazy.get = lazy('get-value');
lazy.copy = lazy('copy');

/**
 * Expose `utils`
 */

var utils = module.exports;

/**
 * Logging symbols
 */

utils.symbol = {
  success: require('success-symbol'),
  error: require('error-symbol'),
};

utils.bold = require('ansi-bold');

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
  } catch(err) {};
  return null;
};

utils.tryRead = function tryRead(fp) {
  try {
    return fs.readFileSync(path.resolve(fp));
  } catch(err) {};
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

/**
 * Add a non-enumerable property to `receiver`
 *
 * @param  {Object} `obj`
 * @param  {String} `name`
 * @param  {Function} `val`
 */

utils.defineProp = function defineProp(receiver, key, value) {
  return Object.defineProperty(receiver, key, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: value
  });
};

/**
 * Delegate non-enumerable properties from `provider` to `receiver`.
 *
 * @param  {Object} `receiver`
 * @param  {Object} `provider`
 */

utils.delegate = function delegate(receiver, provider) {
  for (var method in provider) {
    utils.defineProp(receiver, method, provider[method]);
  }
};
