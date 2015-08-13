'use strict';
// require('time-require');

var fs = require('fs');
var path = require('path');
var relative = require('relative');
var extend = require('extend-shallow');
var lazy = require('lazy-cache')(require);
lazy.visit = lazy('collection-visit');
lazy.detect = lazy('detect-conflicts');
lazy.rewrite = lazy('rewrite-ext');
lazy.write = lazy('write');
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

  this.history = [];
  if (typeof file === 'string') {
    var path = file;
    file = {path: path};
  }
  if (typeof file === 'object') {
    this.options = file.options || {};
    this.visit('set', file);
  }

  this.contents = file.contents || null;
}

/**
 * Snippet prototype methods
 */

Snippet.prototype = {
  constructor: Snippet,

  option: function (prop, val) {
    if (typeof prop === 'object') {
      return this.visit('option', prop);
    }
    utils.set(this.options, prop, val);
    return this;
  },

  set: function (prop, val) {
    if (typeof prop === 'object') {
      return this.visit('set', prop);
    }
    utils.set(this, prop, val);
    return this;
  },

  get: function (prop) {
    return utils.get(this, prop);
  },

  use: function (fn) {
    this.contents = fn.call(this, this.contents);
    return this;
  },

  read: function (fp) {
    if (this.contents) return this;
    fp = path.resolve(this.cwd, fp || this.path);
    this.contents = utils.tryRead(fp);
    return this;
  },

  /**
   * Returns a snippet object from the given `contents`.
   */

  toSnippet: function (val, opts) {
    if (typeof val === 'function') {
      return new Snippet(val(this));
    }
    if (typeof val === 'string') {
      var str = utils.tryRead(val) || val;
      return new Snippet({val: str, options: opts});
    }
    if (val instanceof Snippet) {
      val.options = extend({}, val.options, opts);
      return val;
    }
    if (typeof val === 'object') {
      val.options = extend({}, val.options, opts);
      return new Snippet(val);
    }
  },

  prepare: function (str, options) {
    var snippet = this.toSnippet(str, options);

    var opts = extend({}, options, this.options);
    if (str instanceof Snippet) {
      extend(opts, snippet.options);
      var snippet = str;
      if (!snippet.contents) snippet.read();
      str = snippet.contents;
    }
    if (!this.contents) this.read();
    return str;
  },

  edit: function (str, action, options) {
    str = prepare(str, options);

    if (action === 'inject') {
      this.inject(str, options);
      return this;
    }
    var contents = this.contents.toString();
    if (action === 'append') {
      this.contents += str;
      return this;
    }
    if (action === 'prepend') {
      this.contents = str + this.contents;
      return this;
    }
    return this;
  },

  prepend: function (str) {
    if (str instanceof Snippet) {
      var snippet = str;
      if (!snippet.contents) {
        snippet.read();
      }
      str = snippet.contents.toString();
    }
    if (!this.contents) this.read();
    this.contents = utils.prepend(str, this.contents.toString());
    return this;
  },

  append: function (str) {
    if (str instanceof Snippet) {
      var snippet = str;
      if (!snippet.contents) {
        snippet.read();
      }
      str = snippet.contents.toString();
    }
    if (!this.contents) this.read();
    this.contents = utils.append(str, this.contents.toString());
    return this;
  },

  inject: function (str, options) {
    var opts = {marker: 'snippet', action: 'add'};
    extend(opts, this.options);
    extend(opts, options);

    var contents = this.contents.toString();

    if (str instanceof Snippet) {
      var snippet = str;
      if (!snippet.contents) {
        snippet.read();
      }
      str = snippet.contents.toString();
      extend(opts, snippet.options);
    }

    if (!this.contents) this.read();
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

  write: function (dir, opts, cb) {
    if (typeof dir === 'function') {
      cb = dir;
      opts = {};
      dir = null;
    }
    if (typeof opts === 'function') {
      cb = opts;
      opts = {};
    }
    if (typeof dir === 'object') {
      opts = dir;
      dir = null;
    }

    if (typeof cb !== 'function') {
      throw new Error('async `write` was called without a callback function.');
    }

    // TODO: clean this up!
    opts = opts || this.options;
    this.contents = this.contents ? this.contents.toString() : null;

    var str = this.contents;
    var dest = dir ? path.join(dir, path.basename(this.path)) : this.path;

    var file = {};
    file.contents = str;
    file.path = dest;

    var detect = lazy.detect();
    detect(file, opts, function (res) {
      if (str) {
        var write = lazy.write();
        write(file.path, str, cb.bind(this));
      } else {
        this.copy(file.path, cb);
      }
      return this;
    }.bind(this));

    return this;
  },

  copy: function (dest, cb) {
    var opts = this.options;
    utils.copy(this.path, dest, opts, cb.bind(this));
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
      var write = lazy.write();
      write.sync(dest, str);
      utils.success('file written to', utils.bold(dest));
    } else {
      utils.copy.sync(src, dest);
      utils.success('file copied to', utils.bold(dest));
    }
    return this;
  },

  mixin: function (key, val) {
    Snippet.prototype[key] = val;
    return this;
  },

  visit: function (method, val) {
    var visit = lazy.visit();
    visit(this, method, val);
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
    var rewrite = lazy.rewrite();
    this.path = rewrite(this.path, ext);
  }
});


/**
 * Expose `Snippet`
 */

module.exports = Snippet;
