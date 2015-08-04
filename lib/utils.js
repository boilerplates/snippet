'use strict';

// require('time-require');

var fs = require('fs');
var path = require('path');
var extend = require('extend-shallow');
var green = require('ansi-green');
var red = require('ansi-red');

/**
 * Logging symbols
 */

var symbol = {
  success: require('success-symbol'),
  error: require('error-symbol'),
};


/**
 * Expose `utils`
 */

var utils = module.exports;

utils.append = function (str, content) {
  return str + content;
};

utils.prepend = function (str, content) {
  return content + str;
};

utils.inject = function (str, content, options) {
  options = options || {};
  var action = options.action || 'add';
  var marker = options.marker || [utils.marker('snippet')];
  marker = Array.isArray(marker) ? marker : [marker];
  var start = marker[0];
  var end = marker[1];

  var i = str.indexOf(start);
  if (i === -1) return str;

  var e = end ? str.indexOf(end, i + 1) : -1;
  if (i !== -1 && e !== -1) {
    var head = str.slice(0, i + (action === 'add' ? start.length : 0)) + '\n';
    var tail = str.slice(e, (action === 'add' ? 0 : e.length));
    return head + content + '\n' + tail;
  }
  var res = ((end && action === 'add') ? start : '')
    + content
    + ((end && action === 'add') ? end : '');

  return str.split(start).join(res);
};

utils.marker = function(name) {
  return '<!-- ' + name + ' -->';
};

utils.tryRequire = function tryRequire(fp) {
  try {
    return require(path.resolve(fp));
  } catch(err) {};
  return null;
};

utils.error = function error() {
  var args = [].slice.call(arguments);
  args.unshift(red(symbol.error));
  console.log.apply(console, args);
  return this;
};

utils.success = function success() {
  var args = [].slice.call(arguments);
  args.unshift(green(symbol.success));
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
