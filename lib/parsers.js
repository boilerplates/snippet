'use strict';

function Parsers(options) {
  if (!(this instanceof Parsers)) {
    return new Parsers(options);
  }
  this.options = options || {};
  this.fns = {};

  if (this.options.parsers) {
    this.visit('register', this.options.parsers);
  }
}

Parsers.prototype = {
  register: function(key, fn) {
    this.fns[key] = fn;
    return this;
  },

  parse: function (key) {
    var args = [].slice.call(arguments, 1);
    if (!this.fns.hasOwnProperty(key)) {
      throw new Error('parser: ' + key + ' does not exist.');
    }
    return this.fns[key].apply(this, args);
  },

  mixin: function (key, val) {
    Parsers.prototype[key] = val;
    return this;
  },

  visit: function (method, val) {
    visit(this, method, val);
    return this;
  }
};

/**
 * Expose `Parsers`
 */

module.exports = Parsers;
