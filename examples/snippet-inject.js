var Snippets = require('..');
var snippets = new Snippets();

snippets.load('test/fixtures/*.hbs');

var a = snippets
  .get('test/fixtures/a.hbs')
  .set('marker', ['<!-- snippet -->', '<!-- endsnippet -->'])

var b = snippets
  .get('test/fixtures/inject.hbs')
  .inject(a, {marker: 'foo', action: 'add'})
  .inject(a)
  .write({force: true})


console.log(b.contents.toString());
