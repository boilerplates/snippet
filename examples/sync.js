'use strict';

var fs = require('fs');
var Readers = require('../lib/readers');
var readers = new Readers();

/**
 * sync readers
 */

readers.register('file', function (fp) {
  return this.fns.buffer(fp).toString();
});

readers.register('buffer', function (fp) {
  return fs.readFileSync(fp);
});

readers.register('a', function (fp) {
  return this.fns.file(fp) + '\naaa';
});

readers.register('b', function (fp) {
  return this.fns.a(fp) + '\nbbb';
});

readers.register('c', function (fp) {
  return this.fns.b(fp) + '\nccc';
})

// var res = readers.fns.c('.verb.md');
// // console.log(res);

var result = readers.read('c', '.verb.md')
  .use(function (val) {
    return val + 1;
  })
  .use(function (val) {
    return val + 2;
  })
  .use(function (val) {
    return val + 3;
  })
  .use(function (val) {
    return val + 4;
  })

console.log(result);
