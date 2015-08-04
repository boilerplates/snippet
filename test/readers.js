'use strict';

/* deps: mocha */
var fs = require('fs');
var assert = require('assert');
var should = require('should');
var Readers = require('../lib/readers');
var readers;

describe('readers', function () {
  beforeEach(function () {
    readers = new Readers();
  });

  it('should add registered readers to `readers.fns`:', function () {
    readers.register('a', function () {});
    readers.register('b', function () {});
    readers.register('c', function () {});
    readers.fns.should.have.properties(['a', 'b', 'c']);
  });
});

describe('sync', function () {
  describe('read', function () {
    beforeEach(function () {
      readers = new Readers();
    });

    it('should read with a sync reader:', function () {
      readers.register('buffer', function (fp) {
        return fs.readFileSync(fp);
      });

      var actual = readers.read('buffer', 'LICENSE');
      assert.equal(Buffer.isBuffer(actual.value), true);
    });

    it('should allow readers to use other readers:', function () {
      readers.register('buffer', function (fp) {
        return fs.readFileSync(fp);
      });

      readers.register('file', function (fp) {
        return this.fns.buffer(fp).toString();
      });

      var actual = readers.read('file', 'LICENSE');
      assert.equal(Buffer.isBuffer(actual.value), false);
      assert.equal(typeof actual.value === 'string', true);
    });
  });
});

describe('async', function () {
  describe('read', function () {
    beforeEach(function () {
      readers = new Readers();
    });

    it('should read with an async reader:', function (done) {
      readers.register('buffer', function (fp, cb) {
        return fs.readFile(fp, function (err, res) {
          if (err) return cb(err);
          cb(null, res);
        });
      });

      readers.read('buffer', 'LICENSE', function (err, actual) {
        assert.equal(Buffer.isBuffer(actual), true);
        done();
      });
    });

    it('should allow readers to use other readers:', function (done) {
      readers.register('buffer', function (fp, cb) {
        return fs.readFile(fp, function (err, res) {
          if (err) return cb(err);
          cb(null, res);
        });
      });

      readers.register('file', function (fp, cb) {
        return readers.fns.buffer(fp, function (err, buffer) {
          if (err) return cb(err);

          cb(null, buffer.toString());
        });
      });

      readers.read('file', '.verb.md', function (err, actual) {
        assert.equal(Buffer.isBuffer(actual), false);
        assert.equal(typeof actual === 'string', true);
        done();
      });
    });
  });
});
