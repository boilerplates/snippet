'use strict';
// require('time-require');

var path = require('path');
var relative = require('relative');
var define = require('define-property');
var extend = require('extend-shallow');
var utils = require('./utils');

/**
 * Create a new `Snippet`, optionally passing a `file` object
 * to start with.
 *
 * @param {Object} `file`
 * @api public
 */

function Snippet(file) {
  if (!(this instanceof Snippet)) {
    return new Snippet(file);
  }
  if (typeof file === 'string') {
    file = {path: file};
  }

  this.history = [];

  if (typeof file === 'object') {
    this.visit('set', file);
  }

  this.cwd = this.cwd || process.cwd();
  this.content = this.content || null;
  this.options = this.options || {};
}

/**
 * Snippet prototype methods
 */

Snippet.prototype = {
  constructor: Snippet,

  /**
   * Set or get an option on the snippet. Dot notation may be used.
   *
   * @param  {String} `prop` The property to get.
   * @api public
   */

  option: function (prop, val) {
    if (arguments.length === 1) {
      if (typeof prop === 'string') {
        return utils.get(this.options, prop);
      }
      if (typeof prop === 'object') {
        return this.visit('option', prop);
      }
    }
    utils.set(this.options, prop, val);
    return this;
  },

  /**
   * Set a property on the snippet. Dot notation may be used.
   *
   * @param  {String} `prop` The property to set.
   * @api public
   */

  set: function (prop, val) {
    if (typeof prop === 'object') {
      return this.visit('set', prop);
    }
    utils.set(this, prop, val);
    return this;
  },

  /**
   * Get a property from the snippet. Dot notation may be used.
   *
   * @param  {String} `prop` The property to get.
   * @api public
   */

  get: function (prop) {
    return utils.get(this, prop);
  },

  /**
   * Read a utf8 string from the file system, or return if
   * `content` is already a string.
   *
   * @param  {String} `fp` Filepath
   * @api public
   */

  read: function (fp) {
    if (this.content) return this;
    fp = path.resolve(this.cwd, fp || this.path);
    this.content = utils.tryRead(fp);
    return this;
  },

  /**
   * Attempts to return a snippet object from the given `value`.
   *
   * @param  {String|Object} `val` Can be a filepath, content string, object or instance of `Snippet`.
   * @param  {Object} `opts`
   * @api public
   */

  toSnippet: function (val, opts) {
    if (typeof val === 'function') {
      return new Snippet(val(this));
    }
    if (typeof val === 'string') {
      var str = utils.tryRead(val);
      var res = {content: null, options: opts || {}};
      if (str) {
        res.path = val;
        res.content = str.toString();
      } else {
        res.content = val;
      }
      return new Snippet(res);
    }
    if (val instanceof Snippet) {
      val.option(opts);
      return val;
    }
    if (typeof val === 'object') {
      val.options = extend({}, val.options, opts);
      return new Snippet(val);
    }
  },

  /**
   * Prepend the snippet's contents to the given `string`.
   *
   * @param  {String} `str`
   * @param  {Object} `opts`
   * @api public
   */

  prepend: function (str, opts) {
    var snippet = this.toSnippet(str, opts);
    return utils.prepend(this, snippet);
  },

  /**
   * Append the snippet's contents to the given `string`.
   *
   * @param  {String} `str`
   * @param  {Object} `opts`
   * @api public
   */

  append: function (str, opts) {
    var snippet = this.toSnippet(str, opts);
    return utils.append(this, snippet);
  },

  /**
   * Inject the snippet's contents into the given `string` at the
   * defined point of insertion (`<!-- snippet -->`)
   *
   * @param  {String} `str`
   * @param  {Object} `opts`
   * @api public
   */

  inject: function (str, opts) {
    opts = extend({marker: 'snippet', action: 'add'}, opts);
    opts = extend({}, this.options, opts);

    var snippet = this.toSnippet(str, opts);
    return utils.inject(this, snippet, opts);
  },

  /**
   * Calculate the destination path based on the given function or `filepath`.
   *
   * @param {String|Function} `fp`
   * @return {String} Returns the destination path.
   * @api public
   */

  dest: function (fp, options) {
    if (typeof fp === 'function') {
      return fp.call(this, this.path);
    }

    var opts = extend({}, this.options, options);
    if (typeof fp === 'object') {
      opts = extend({}, opts, fp);
    }

    if (typeof fp === 'string' && ~fp.indexOf(':')) {
      fp = fp.replace(/:(\w+)/g, function (m, prop) {
        return opts[prop] || this[prop] || m;
      }.bind(this));
    }

    this.path = this.path || fp;
    var base = opts.base || this.base || path.dirname(fp);
    var name = opts.basename || this.relative || this.basename;
    var ext = opts.ext || this.extname || path.extname(fp);

    if (typeof fp === 'string' && fp[fp.length - 1] === '/') {
      base = fp;
    }

    var dest = path.join(base, utils.rewrite(name, ext));
    if (dest.slice(-1) === '.') {
      dest = dest.slice(0, dest.length - 1) + ext;
    }
    return dest;
  },

  /**
   * Asynchronously write the snippet to disk.
   *
   * @param {String} `fp` Destination filepath.
   * @param {Function} `cb` Callback function
   * @returns {Object} Returns the instance for chaining.
   * @api public
   */

  write: function (fp, opts, cb) {
    if (typeof fp !== 'string') {
      cb = opts;
      opts = fp;
      fp = null;
    }
    if (typeof opts === 'function') {
      cb = opts;
      opts = {};
    }
    if (typeof cb !== 'function') {
      throw new Error('expected a callback function.');
    }

    var dest = this.dest(fp || this.path, opts);
    var file = { contents: this.content, path: dest };
    opts = extend({ ask: true }, this.options, opts);
    utils.detect(file, opts, function (err) {
      if (file.contents) {
        utils.write(dest, file.contents, cb);
      } else {
        this.copy(dest, cb);
      }
      return this;
    }.bind(this));
    return this;
  },

  /**
   * Write the item to disk synchronously.
   *
   * @param  {String} `fp` Destination filepath.
   * @return {Object} Returns the instance for chaining.
   * @api public
   */

  writeSync: function (fp, opts) {
    var dest = path.resolve(this.dest(fp || this.path, opts));
    var file = { contents: this.content, path: dest };
    opts = extend({ ask: true, silent: false }, this.options, opts);

    utils.detect(file, opts, function (err) {
      if (file.contents) {
        utils.writeSync(dest, file.contents);
        utils.success('file written to', utils.bold(dest));
      } else {
        utils.copy.sync(this.path, dest);
        utils.success('file copied to', utils.bold(dest));
      }
    });
    return this;
  },

  /**
   * Copy snippet from its defined `path` to the given `dest`.
   *
   * @param  {String} `dest`
   * @param  {Function} `cb`
   * @api public
   */

  copy: function (dest, cb) {
    utils.copy(this.path, dest, this.options, cb);
    return this;
  },

  mixin: function (key, val) {
    Snippet.prototype[key] = val;
    return this;
  },

  visit: function (method, val) {
    utils.visit(this, method, val);
    return this;
  }
};

Object.defineProperty(Snippet.prototype, 'content', {
  get: function() {
    return this._content;
  },
  set: function(val) {
    if (Buffer.isBuffer(val)) {
      val = val.toString();
    }
    define(this, '_content', val);
  }
});

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
    define(this, '_name', name);
  }
});

Object.defineProperty(Snippet.prototype, 'cwd', {
  get: function() {
    return path.resolve(this._cwd || process.cwd());
  },
  set: function(cwd) {
    define(this, '_cwd', cwd || process.cwd());
  }
});

Object.defineProperty(Snippet.prototype, 'relative', {
  get: function() {
    if (!this.base) {return null; }
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
    this.path = utils.rewrite(this.path, ext);
  }
});


/**
 * Expose `Snippet`
 */

module.exports = Snippet;
