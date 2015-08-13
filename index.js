/*!
 * snippet <https://github.com/jonschlinkert/snippet>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';
require('time-require');

var url = require('url');

/**
 * Lazily required module dependencies
 */

var lazy = require('lazy-cache')(require);
lazy.glob = lazy('globby');
lazy.visit = lazy('collection-visit');
lazy.startsWith = lazy('starts-with');
lazy.FetchFiles = lazy('fetch-files');
lazy.DataStore = lazy('data-store');
lazy.omit = lazy('object.omit');
lazy.set = lazy('set-value');
lazy.get = lazy('get-value');

/**
 * Local dependencies
 */

// var Generate = require('generate');
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
  // Generate.call(this, options);
  this.options = options || {};
  this.store = store(this.options);

  this.snippets = {};
  this.cache = {};
  this.cache.data = {};

  var FetchFiles = lazy.FetchFiles();
  this.downloader = new FetchFiles(this.options);
  this.presets = this.downloader.presets;
  this.defaultConfig();

  if (typeof this.options.templates === 'object') {
    this.visit('set', this.options.templates);
  }
}

// Generate.extend(Snippets);
// Template.extend(Snippets);

/**
 * Snippets prototype methods
 */

utils.delegate(Snippets.prototype, {
  constructor: Snippets,

  defaultConfig: function () {
  },

  set: function (prop, val) {
    if (typeof prop === 'object') {
      return this.visit('set', prop);
    }
    var set = lazy.set();
    set(this.snippets, prop, val);
    return this;
  },

  save: function (prop, val) {
    if (typeof prop === 'object') {
      return this.visit('save', prop);
    }
    this.store.set(prop, val);
    return this;
  },

  /**
   * Get a cached or persisted snippet by name.
   *
   * @param  {String} `name`
   * @param  {Object} `preset` Preset to use if a URL is passed.
   * @return {Object}
   */

  get: function (name, preset) {
    if(typeof name !== 'string') {
      throw new TypeError('snippets#get expects `name` to be a string.');
    }
    var startsWith = lazy.startsWith();
    if (startsWith(name, './')) {
      return this.read(name);
    }
    // ://
    if (/^\w+:\/\//.test(name) || preset) {
      var snippet = this.downloader
        .fetch(name, preset)
        .download();

      var parsed = url.parse(name);
      this.set(parsed.pathname, snippet);
      return new Snippet(snippet);
    }

    var get = lazy.get();
    var res = this.snippets[name]
      || this.store.get(name)
      || get(this.snippets, name);
    return new Snippet(res);
  },

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

  addSnippets: function (snippets) {
    this.visit('set', snippets);
    return this;
  },

  /**
   * Fetch a remote snippet from the given URL.
   *
   * @param  {String} `url`
   * @param  {Object} `preset`
   * @return {Object} Returns a snippet object.
   */

  fetch: function (url, preset) {
    return this.downloader.fetch(url, {preset: preset});
  },

  download: function () {
    return this.downloader.download(this.downloader, arguments);
  },

  read: function (snippet) {
    if(typeof snippet === 'string') {
      snippet = new Snippet({path: snippet});
    }
    return snippet.read();
  },

  expand: function (str, data) {
    return expand(str, data);
  },

  prepend: function (str, content) {
    return utils.prepend(str, content);
  },

  append: function (str, content) {
    return utils.append(str, content);
  },

  inject: function (str, marker) {
    return utils.inject(str, this.contents, marker);
  },

  del: function (prop) {
    var omit = lazy.omit();
    omit(this.snippets, prop);
    this.store.del(prop);
    return this;
  },

  mixin: function (key, val) {
    Snippets.prototype[key] = val;
    return this;
  },

  visit: function (method, val) {
    var visit = lazy.visit();
    visit(this, method, val);
    return this;
  }
});

function store(options) {
  options = options || {};
  var DataStore = lazy.DataStore();
  return new DataStore('snippets', options.store || {});
}

/**
 * Expose `Snippets`
 */

module.exports = Snippets;

/**
 * Expose constructors
 */

module.exports.Snippet = Snippet;
