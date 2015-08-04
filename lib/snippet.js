'use strict';
// require('time-require');

var fs = require('fs');
var path = require('path');
var relative = require('relative');
var bold = require('ansi-bold');
var extend = require('extend-shallow');
var lazy = require('lazy-cache')(require);
var visit = lazy('collection-visit');
var rewrite = lazy('rewrite-ext');
var copy = lazy('copy');
var write = lazy('write');
var set = lazy('set-value');
var get = lazy('get-value');
var utils = require('./utils');
var detect = require('file-conflicts');

/**
 * Create a new `Snippet`, optionally passing a `file` object
 * to start with.
 *
 * @param {Object} `file`
 * @api public
 */

function Snippet(file) {
  this.history = [];

  if (typeof file === 'string') {
    this.path = file;
  } else if (typeof file === 'object') {
    this.options = file.options || {};
    this.visit('set', file);
  }
}

/**
 * Snippet prototype methods
 */

Snippet.prototype = {
  constructor: Snippet,

  set: function (prop, val) {
    if (typeof prop === 'object') {
      return this.visit('set', prop);
    }
    set()(this, prop, val);
    return this;
  },

  get: function (prop) {
    return get()(this, prop);
  },

  use: function (fn) {
    this.contents = fn.call(this, this.contents);
    return this;
  },

  read: function (fp) {
    if (this.contents) return this;
    fp = path.resolve(this.cwd, fp || this.path);
    this.contents = fs.readFileSync(fp);
    return this;
  },

  prepend: function (str) {
    return utils.prepend(str, this.contents.toString());
  },

  append: function (str) {
    return utils.append(str, this.contents.toString());
  },

  inject: function (str, options) {
    if (!this.contents) this.read();
    var contents = this.contents.toString();
    var opts = {marker: 'snippet', action: 'add'};

    if (str instanceof Snippet) {
      var snippet = str;
      if (!snippet.contents) {
        snippet.read();
      }
      str = snippet.contents.toString();
      extend(opts, snippet.options);
    }
    opts = extend({}, opts, options);
    this.contents = utils.inject(contents, str, opts);
    return this;
  },

  /**
   * Asynchronously write the snippet to disk.
   *
   * @param {String} `fp` Destination filepath.
   * @param {Function} `cb` Callback function
   * @returns {Object} Returns the instance for chaining.
   * @api public
   */

  write: function (fp, cb) {
    if (typeof fp === 'function') {
      cb = fp;
      fp = null;
    }

    if (typeof cb !== 'function') {
      throw new Error('async `write` was called without a callback function.');
    }

    // TODO: clean this up!
    var src = this.path;
    this.contents = this.contents ? this.contents.toString() : null;
    var str = this.contents;
    var dest = fp || this.dest.path || src;

    var opts = this.options || {};
    var file = {};
    file.contents = str;
    file.path = typeof dest === 'string'
      ? path.resolve(dest, path.basename(src))
      : null;

    detect(file, opts, function (res) {
      if (str) {
        write()(file.path, str, cb.bind(this));
      } else {
        this.copy(file.path, cb);
      }
      return this;
    }.bind(this));

    return this;
  },

  copy: function (dest, cb) {
    var opts = this.options;
    utils.copy()(this.path, dest, opts, cb.bind(this));
    return this;
  },

  /**
   * Write the item to disk synchronously.
   *
   * @param  {String} `fp` Destination filepath.
   * @return {Object} Returns the instance for chaining.
   * @api public
   */

  writeSync: function (fp) {
    var dest = fp || this.dest.path;
    var src = this.src.path;
    var str = this.content;

    if (str) {
      write().sync(dest, str);
      this.success('file written to', bold(dest));
    } else {
      copy().sync(src, dest);
      this.success('file copied to', bold(dest));
    }
    return this;
  },

  success: function () {
    utils.success.apply(utils, arguments);
    return this;
  },

  error: function () {
    utils.error.apply(utils, arguments);
    return this;
  },

  mixin: function (key, val) {
    Snippet.prototype[key] = val;
    return this;
  },

  visit: function (method, val) {
    visit()(this, method, val);
    return this;
  }
};

Object.defineProperty(Snippet.prototype, 'path', {
  get: function() {
    return this.history[this.history.length - 1];
  },
  set: function(fp) {
    if (typeof fp !== 'string') {
      throw new Error('`snippet.path` must be a string.');
    }
    if (fp && fp !== this.path) {
      this.history.push(fp);
    }
  }
});

Object.defineProperty(Snippet.prototype, 'name', {
  get: function() {
    return this._name;
  },
  set: function(name) {
    if (name && typeof name !== 'string') {
      throw new Error('`snippet.name` must be a string.');
    }
    name = name || path.basename(this.path, path.extname(this.path));
    utils.defineProp(this, '_name', name);
  }
});

Object.defineProperty(Snippet.prototype, 'cwd', {
  get: function() {
    return path.resolve(this._cwd || process.cwd());
  },
  set: function(cwd) {
    utils.defineProp(this, '_cwd', cwd || process.cwd());
  }
});

Object.defineProperty(Snippet.prototype, 'relative', {
  get: function() {
    if (!this.base) {
      throw new Error('`snippet.base` must be defined to get relative path.');
    }
    if (!this.path) {
      throw new Error('`snippet.path` must be defined to get relative path.');
    }
    return relative(this.base, this.path);
  },
  set: function() {
    throw new Error('file.relative is read-only and cannot be overridden.');
  }
});

Object.defineProperty(Snippet.prototype, 'absolute', {
  get: function() {
    if (!this.path) {
      throw new Error('`snippet.path` must be defined to get absolute path.');
    }
    return path.resolve(this.base, this.path);
  },
  set: function() {
    throw new Error('file.absolute is read-only and cannot be overridden.');
  }
});

Object.defineProperty(Snippet.prototype, 'dirname', {
  get: function() {
    if (!this.path) {
      throw new Error('`snippet.path` must be defined to get dirname.');
    }
    return path.dirname(this.path);
  },
  set: function(dirname) {
    if (!this.path) {
      throw new Error('`snippet.path` must be defined to set dirname.');
    }
    this.path = path.join(dirname, path.basename(this.path));
  }
});

Object.defineProperty(Snippet.prototype, 'basename', {
  get: function() {
    if (!this.path) {
      throw new Error('`snippet.path` must be defined to get basename.');
    }
    return path.basename(this.path);
  },
  set: function(basename) {
    if (!this.path) {
      throw new Error('`snippet.path` must be defined to set basename.');
    }
    this.path = path.join(path.dirname(this.path), basename);
  }
});

Object.defineProperty(Snippet.prototype, 'extname', {
  get: function() {
    if (!this.path) {
      throw new Error('`snippet.path` must be defined to get extname.');
    }
    return path.extname(this.path);
  },
  set: function(extname) {
    if (!this.path) {
      throw new Error('`snippet.path` must be defined to set extname.');
    }
    var ext = extname || this._extname || (this._extname = path.extname(this.path));
    this.path = rewrite()(this.path, ext);
  }
});


/**
 * Expose `Snippet`
 */

module.exports = Snippet;
