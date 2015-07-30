'use strict';

function Readers(options) {
  if (!(this instanceof Readers)) {
    return new Readers();
  }
  this.options = options || {};
  this.fns = {};

  if (this.options.readers) {
    this.visit('register', this.options.readers);
  }
}

Readers.prototype = {
  register: function(key, fn) {
    this.fns[key] = fn.bind(this);
    return this;
  },

  read: function(key) {
    var args = [].slice.call(arguments, 1);
    if (!this.fns.hasOwnProperty(key)) {
      throw new Error('reader: ' + key + ' does not exist.');
    }
    return this.fns[key].apply(this, args);
  },

  mixin: function (key, val) {
    Readers.prototype[key] = val;
    return this;
  },

  visit: function (method, val) {
    visit(this, method, val);
    return this;
  }
};

/**
 * Expose `Readers`
 */

module.exports = Readers;
