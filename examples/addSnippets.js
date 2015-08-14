var Snippets = require('..');
var snippets = new Snippets();

snippets.addSnippets('test/fixtures/*.hbs');
console.log(snippets);
