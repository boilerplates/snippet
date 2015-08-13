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

  it('should get a snippet from the snippet store:', function () {
    snippets.save('a', {path: 'foo'});
    snippets.get('a').should.have.properties('name', 'content', 'path');
  });

  it('should get a snippet from memory:', function () {
    snippets.set('b', {path: 'foo'});
    snippets.get('b').should.have.properties('path', 'content');
  });

  it('should get a snippet from a file:', function () {
    var actual = snippets.get('./test/fixtures/a.hbs');
    actual.should.have.properties('content', 'path');
  });
});
