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
//   .use(function (contents) {
//     var str = contents.toString();
//     return _.template(str)(this.data);
//   })
  .write('test/actual/', function (err) {
    if (err) console.log(err);
  });

console.log(snippet);
