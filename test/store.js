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

  it('should add an item to the snippet store:', function () {
    snippets.store.set('a', {path: 'foo', contents: 'bar', name: 'foo'});
    snippets.store.get('a').should.have.properties('path', 'contents');
  });

  it('should get a stored item with `.get`:', function () {
    snippets.store.set('b', {path: 'foo', contents: 'bar'});
    console.log(snippets.get('b'))
    snippets.get('b').should.have.properties('path', 'contents', 'name');
  });
});
