'use strict';

/* deps: mocha */
var fs = require('fs');
var assert = require('assert');
var should = require('should');
var Snippets = require('../');
var snippets;

describe('snippets', function () {
  beforeEach(function () {
    snippets = new Snippets({store: {cwd: 'test'}});
  });

  it('should save a snippet to the snippet store:', function () {
    snippets.save('a', {name: 'foo', contents: 'bar'});
    snippets.get('a').should.have.properties('name', 'contents');
  });
});
