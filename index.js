/*!
 * snippet <https://github.com/jonschlinkert/snippet>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';
// require('time-require');

var url = require('url');

/**
 * Lazily required module dependencies
 */

var lazy = require('lazy-cache')(require);
var delegate = require('delegate-properties');
var extend = require('extend-shallow');
lazy.FetchFiles = lazy('fetch-files');
lazy.DataStore = lazy('data-store');
lazy.glob = lazy('globby');

/**
 * Local dependencies
 */

var Snippet = require('./lib/snippet');
var expand = require('./lib/expand');
var utils = require('./lib/utils');

/**
 * Create an instance of `Snippets` with the given options.
 *
 * @param {Object} `options`
 * @api public
 */

function Snippets(options) {
  this.options = options || {};
  this.store = store(this.options);

  this.snippets = {};
  this.presets = {};
  this.cache = {};
  this.cache.data = {};

  var FetchFiles = lazy.FetchFiles();
  this.downloader = new FetchFiles(this.options);
  this.presets = this.downloader.presets;

  if (typeof this.options.templates === 'object') {
    this.visit('set', this.options.templates);
  }
}

/**
 * Snippets prototype methods
 */

delegate(Snippets.prototype, {
  constructor: Snippets,

  /**
   * Cache a snippet or arbitrary value in memory.
   *
   * @param  {String} `name` The snippet name
   * @param  {any} `val`
   * @return {Object} Returns the `Snippet` instance for chaining
   * @api public
   */

  set: function (name, val) {
    if (typeof name === 'object') {
      return this.visit('set', name);
    }
    utils.set(this.snippets, name, val);
    return this;
  },

  /**
   * Cache a snippet in memory. Creates a `Snippet` instance
   * with the given `value`.
   *
   *
   * @param  {String} `name` The snippet name
   * @param  {any} `val`
   * @return {Object} Returns the `Snippet` instance for chaining
   * @api public
   */

  addSnippet: function (name, val) {
    if (typeof name === 'object') {
      return this.visit('set', name);
    }
    utils.set(this.snippets, name, new Snippet(val));
    return this;
  },

  /**
   * Create a `new Snippet()` from a snippet object,
   * or array of snippet objects.
   *
   * @param {Object|Array} `snippets`
   * @api public
   */

  addSnippets: function (snippets) {
    this.visit('addSnippet', snippets);
    return this;
  },

  /**
   * Persist a snippet or arbitrary value to disk.
   *
   * @param  {String} `name`
   * @param  {any} `val`
   * @return {Object} Returns the `Snippet` instance for chaining
   * @api public
   */

  save: function (name, val) {
    if (typeof name === 'object') {
      return this.visit('save', name);
    }
    this.store.set(name, val);
    return this;
  },

  /**
   * Get a snippet or arbitrary value by `name`. Cached,
   * local, or remote.
   *
   * @param  {String} `name`
   * @param  {Object} `preset` Preset to use if a URL is passed.
   * @return {Object} Returns the requested snippet.
   * @api public
   */

  get: function (name, preset) {
    if(typeof name !== 'string') {
      throw new TypeError('snippets#get expects `name` to be a string.');
    }
    if (utils.startsWith(name, './')) {
      return this.read(name);
    }

    // ex: `http(s)://api.github.com/...`
    if (/^\w+:\/\//.test(name) || preset) {
      var snippet = this.downloader
        .fetch(name, preset)
        .download();

      var parsed = url.parse(name);
      this.set(parsed.pathname, snippet);
      return new Snippet(snippet);
    }

    var res = this.snippets[name]
      || this.store.get(name)
      || utils.get(this.snippets, name);
    return new Snippet(res);
  },

  /**
   * Delete snippet `name` from memory and/or snippet-store.
   * This will not delete actual snippet files saved on disk, only
   * cached snippets.
   *
   * @param {String} `name` The name of the snippet to delete
   * @return {Object} `Snippets` instance, for chaining
   * @api public
   */

  del: function (prop) {
    utils.omit(this.snippets, prop);
    this.store.del(prop);
    return this;
  },

  /**
   * Load a glob of snippets.
   * @param  {String|Array} `snippets
   * @param  {Object} `options`
   * @return {Object} `Snippets` for chaining
   * @api public
   */

  load: function (snippets, options) {
    if (typeof snippets === 'string') {
      var glob = lazy.glob();
      var files = glob.sync(snippets, options);
      files.forEach(function (fp) {
        var key = fp.split('.').join('\\.');
        this.set(key, {path: fp});
      }.bind(this));
    }
    return this;
  },

  /**
   * Read a snippet from the file system. If the snippet is already
   * in memory and is an instance of `Snippet`, the `.read()` method
   * is called on the snippet. Otherwise, a `new Snippet()` is created
   * first before calling the `.read()` method on the snippet.
   *
   * @param  {Object|String} snippet
   * @return {Object}
   * @api public
   */

  read: function (snippet) {
    if(typeof snippet === 'string') {
      snippet = new Snippet({path: snippet});
    }
    snippet.read();
    return snippet;
  },

  /**
   * Set a preset `config` for downloading snippets from a remote URL.
   * @param  {String} `name`
   * @param  {Object} `config`
   * @return {Object}
   */

  preset: function(name, config) {
    return this.downloader.preset(name, config);
  },

  /**
   * Queue a remote snippet to be downloaded from the given URL, and
   * optional `preset`.
   *
   * @param  {String} `url`
   * @param  {Object} `preset` The name
   * @return {Object} Returns a snippet object.
   * @api public
   */

  queue: function (url, config) {
    return this.downloader.fetch(this.downloader, arguments);
  },

  /**
   * Fetch a remote snippet from the given URL.
   *
   * @param  {String} `url`
   * @param  {Object} `preset`
   * @return {Object} Returns a snippet object.
   * @api public
   */

  fetch: function () {
    return this.downloader.download(this.downloader, arguments);
  },

  /**
   * Expand a snippet of code or data.
   *
   * @param  {String} `str`
   * @param  {Object} `data
   * @api public
   */

  expand: function (str, data) {
    return expand(str, data);
  },

  prepend: function (name, target, opts) {
    return this.get(name).prepend(target);
  },

  append: function (name, target, opts) {
    return this.get(name).append(target);
  },

  inject: function (name, target, opts) {
    return this.get(name).inject(target, opts);
  },

  mixin: function (key, val) {
    Snippets.prototype[key] = val;
    return this;
  },

  visit: function (method, val) {
    utils.visit(this, method, val);
    return this;
  }
});

/**
 * Initialize `DataStore`
 */

function store(options) {
  options = options || {};
  var DataStore = lazy.DataStore();
  var opts = extend(options.store || {});
  return new DataStore('snippets', opts);
}

/**
 * Expose `Snippets`
 */

module.exports = Snippets;

/**
 * Expose constructors
 */

module.exports.Snippet = Snippet;
