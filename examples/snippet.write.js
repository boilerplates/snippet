var Snippets = require('..');
var snippets = new Snippets();

snippets.load('test/fixtures/*.hbs');

var snippet = snippets
  .get('test/fixtures/a.hbs')
  .read()
  .set('data', {
    first: 'Jon',
    last: 'Schlinkert'
  })
  .write('test/actual/', function (err) {
    if (err) console.log(err);
    console.log('success!');
  });

