'use strict';

function Writers(options) {
  if (!(this instanceof Writers)) {
    return new Writers(options);
  }
  this.options = options || {};
  this.fns = {};

  if (this.options.writers) {
    this.visit('register', this.options.writers);
  }
}

Writers.prototype = {
  register: function(key, fn) {
    this.fns[key] = fn;
    return this;
  },

  write: function (key) {
    var args = [].slice.call(arguments, 1);
    if (!this.fns.hasOwnProperty(key)) {
      throw new Error('writer: ' + key + ' does not exist.');
    }
    return this.fns[key].apply(this, args);
  },

  mixin: function (key, val) {
    Writers.prototype[key] = val;
    return this;
  },

  visit: function (method, val) {
    visit(this, method, val);
    return this;
  }
};

/**
 * Expose `Writers`
 */

module.exports = Writers;
