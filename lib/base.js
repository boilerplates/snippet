'use strict';

function Base(name, options) {
  if (!(this instanceof Base)) {
    return new Base(name, options);
  }
  this.options = options || {};
}

Base.prototype = {
  register: function(key, fn) {
    this[key] = fn;
    return this;
  },

  run: function (key) {
    if (!this.hasOwnProperty(key)) {
      throw new Error('parser: ' + key + ' does not exist.');
    }
    var args = [].slice.call(arguments, 1);
    this.res = this[key].apply(this, args);
    return this.res;
  },

  use: function (fn) {
    fn.call(this, this.res);
    return this;
  },

  mixin: function (key, val) {
    Base.prototype[key] = val;
    return this;
  },

  visit: function (method, val) {
    visit(this, method, val);
    return this;
  }
};

/**
 * Expose `Base`
 */

module.exports = Base;
