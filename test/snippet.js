'use strict';

/* deps: mocha */
var fs = require('fs');
var assert = require('assert');
var should = require('should');
var Snippet = require('../lib/snippet');
var snippet;

describe('Snippet:', function () {
  describe('Constructor:', function () {
    it('should create a new snippet', function () {
      snippet = new Snippet({contents: 'foo'});
      assert.equal(typeof snippet.get('contents'), 'string');
      snippet.should.have.properties('history', 'content', 'options');
    });
  });

  describe('toSnippet:', function () {
    it('should resolve a snippet object from a path:', function () {
      snippet = new Snippet();
      var snippet = snippet.toSnippet('test/fixtures/a.txt');
      assert.equal(snippet.path, 'test/fixtures/a.txt');
      assert.equal(snippet.content, 'AAA');
    });

    it('should resolve a snippet object from a string:', function () {
      snippet = new Snippet();
      var snippet = snippet.toSnippet('foo bar baz');
      assert.equal(snippet.content, 'foo bar baz');
    });
  });

  describe('set:', function () {
    it('should set a property on a snippet', function () {
      snippet = new Snippet();
      snippet.set('name', 'sidebar');
      assert.equal(snippet.name, 'sidebar');
    });
  });

  describe('get:', function () {
    it('should get a property from a snippet', function () {
      snippet = new Snippet();
      snippet.set('a', 'b');
      snippet.set('c', 'd');
      snippet.set('e', 'f');
      assert.equal(snippet.get('a'), 'b');
      assert.equal(snippet.get('c'), 'd');
      assert.equal(snippet.get('e'), 'f');
    });
  });

  describe('option:', function () {
    it('should set options on a snippet', function () {
      snippet = new Snippet();
      snippet.option('a', 'b');
      snippet.option('c', 'd');
      snippet.option('e', 'f');
      assert.equal(snippet.options.a, 'b');
      assert.equal(snippet.options.c, 'd');
      assert.equal(snippet.options.e, 'f');
    });

    it('should get options from a snippet', function () {
      snippet = new Snippet();
      snippet.option('a', 'b');
      snippet.option('c', 'd');
      snippet.option('e', 'f');
      assert.equal(snippet.option('a'), 'b');
      assert.equal(snippet.option('c'), 'd');
      assert.equal(snippet.option('e'), 'f');
    });
  });

  describe('dest:', function () {
    it('should calculate the dest path:', function () {
      snippet = new Snippet();
      snippet.set('path', 'test/fixtures/a.txt');
      assert.equal(snippet.dest('foo/bar/'), 'foo/bar/a.txt');
    });

    it('should calculate the dest path with the given `ext`:', function () {
      snippet = new Snippet();
      snippet.set('path', 'test/fixtures/a.html');
      assert.equal(snippet.dest('foo/bar/'), 'foo/bar/a.html');
    });

    it('should calculate the dest path with the given `basename`:', function () {
      snippet = new Snippet();
      snippet.set('path', 'test/fixtures/b.txt');
      assert.equal(snippet.dest('foo/bar/'), 'foo/bar/b.txt');
    });

    it('should re-calculate the dest path:', function () {
      snippet = new Snippet();
      snippet.set('path', 'test/fixtures/b.txt');
      assert.equal(snippet.dest('a/b/'), 'a/b/b.txt');
      assert.equal(snippet.dest('a/c/'), 'a/c/b.txt');
      snippet.set('extname', 'md');
      assert.equal(snippet.dest('a/c/'), 'a/c/b.md');
      snippet.set('extname', 'html');
      assert.equal(snippet.dest('a/c/'), 'a/c/b.html');
    });

    it('should resolve params in dest path:', function () {
      snippet = new Snippet();
      snippet.set('path', 'test/fixtures/b.txt');
      snippet.set('aaa', 'foo');
      snippet.set('bbb', 'bar');
      snippet.set('ccc', 'baz');
      assert.equal(snippet.dest(':aaa/:bbb/:ccc/:path'), 'foo/bar/baz/test/fixtures/b.txt');
    });
  });

  describe('prepend:', function () {
    it('should prepend a snippet to a string:', function () {
      snippet = new Snippet({content: 'foo bar baz\n'});
      var str = 'a string.';
      var actual = snippet.prepend(str);
      actual.should.equal('foo bar baz\na string.');
    });
  });

  describe('append:', function () {
    it('should append a snippet to a string:', function () {
      snippet = new Snippet({content: '\nfoo bar baz'});
      var str = 'a string.';
      var actual = snippet.append(str);
      actual.should.equal('a string.\nfoo bar baz');
    });
  });

  describe('inject:', function () {
    it('should inject a snippet into a string with placeholders:', function () {
      snippet = new Snippet({content: 'foo bar baz'});
      var str = 'before <!-- snippet --> after';
      var actual = snippet.inject(str);
      actual.should.equal('before <!-- snippet -->\nfoo bar baz\n<!-- endsnippet --> after');
    });

    it('should not inject a snippet into a string without placeholders:', function () {
      snippet = new Snippet({content: 'foo bar baz'});
      var str = 'before after';
      snippet.inject(str).should.equal('before after');
    });

    it('should inject a snippet into a string and not leave placeholders:', function () {
      snippet = new Snippet({content: 'foo bar baz'});
      var str = 'before <!-- snippet --> after';
      snippet.inject(str, {placeholders: false}).should.equal('before foo bar baz after');
    });

    it('should inject a snippet into a string using a custom placeholder name:', function () {
      snippet = new Snippet({content: 'foo bar baz'});
      var str = 'before <!-- blah --> after';
      var actual = snippet.inject(str, {marker: 'blah'});
      actual.should.equal('before <!-- blah -->\nfoo bar baz\n<!-- endblah --> after');
    });
  });

  describe('read:', function () {
    it('should read content from a file path:', function () {
      snippet = new Snippet();
      snippet.set('path', 'test/fixtures/a.txt');
      assert.equal(snippet.content, null);
      snippet.read();
      assert.equal(snippet.content, 'AAA');
    });
  });

  describe('write:', function () {
    it('should write a snippet to disk:', function (done) {
      snippet = new Snippet({content: 'write test'});
      var dest = 'test/actual/write.txt';
      snippet.dest(dest);
      snippet.write({ask: false, silent: true}, function (err) {
        if (err) return done(err);

        fs.exists(dest, function (exists) {
          assert(exists);
          done();
        })
      });
    });

    it('should synchronously write a snippet to disk:', function () {
      snippet = new Snippet({content: 'write test\n'});
      var dest = 'test/actual/write2.txt';
      snippet.dest(dest);
      snippet.writeSync(dest, {ask: false, silent: true});
      assert(fs.existsSync(dest));
    });
  });

  describe('copy:', function () {
    it('should copy a snippet:', function (done) {
      snippet = new Snippet({path: 'test/fixtures/a.txt'});
      var dest = 'test/actual/copy.txt';
      snippet.dest(dest);
      snippet.copy(dest, function (err) {
        if (err) return done(err);

        fs.exists(dest, function (exists) {
          assert(exists);
          done();
        })
      });
    });
  });
});
