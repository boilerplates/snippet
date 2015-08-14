var Snippets = require('..');
var snippets = new Snippets();

snippets.load('test/fixtures/*.hbs');
console.log(snippets)
