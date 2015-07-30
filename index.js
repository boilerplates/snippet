/*!
 * snippet <https://github.com/jonschlinkert/snippet>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var util = require('util');
var visit = require('object-visit');
var isObject = require('isobject');
var Generate = require('generate');

function Snippets(options) {
  Generate.call(this, options);
  this.snippets = {};

  if (typeof this.options.snippets === 'object') {
    this.visit('set', this.options.snippets);
  }
}
Generate.extend(Snippets);

/**
 * Snippets prototype methods
 */

Snippets.prototype = {
  constructor: Snippets,

  set: function (prop, val) {
    if (typeof prop === 'object') {
      return this.visit('set', prop);
    }
    set(this.snippets, prop, new Snippet(val));
    return this;
  },

  get: function (prop) {
    return get(this.snippets, prop);
  },

  expand: function (str, data) {
    // return emmet.expandAbbreviation(str);
  },

  mixin: function (key, val) {
    Snippets.prototype[key] = val;
    return this;
  },

  visit: function (method, val) {
    visit(this, method, val);
    return this;
  }
};


function Snippet(file) {
  if (!isObject(file)) {
    file = {};
  } else {
    this.path = file.path;
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
    set(this, prop, val);
    return this;
  },

  get: function (prop) {
    return get(this, prop);
  },

  mixin: function (key, val) {
    Snippet.prototype[key] = val;
    return this;
  },

  visit: function (method, val) {
    visit(this, method, val);
    return this;
  }
};

/**
 * Expose `Snippets`
 */

module.exports = new Snippets();

/**
 * Expose constructors
 */

module.exports.Snippets = Snippets;
module.exports.Snippet = Snippet;
