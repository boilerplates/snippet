var Snippets = require('..');
var snippets = new Snippets();

snippets.load('test/{actual,fixtures}/*.{hbs,txt}');

var a = snippets
  .get('test/fixtures/a.hbs')
  .set('marker', ['<!-- snippet -->', '<!-- endsnippet -->'])

var foo = a
  .prepend('foo')
  .append('bar')

var bar = snippets.get('test/fixtures/a.txt');

var b = snippets
  .get('test/actual/inject.hbs')
  .option({marker: 'snippet2', action: 'add'})
  .inject(foo)
  .inject(bar)
  .write('test/actual/', function (err) {
    if (err) console.log(err);
  });

// console.log(b.contents.toString());
