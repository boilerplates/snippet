var Snippets = require('../');
var snippets = new Snippets();

snippets.addSnippet('foo', 'this is a snippet from a string...');
snippets.addSnippets({
  'a': 'this is a snippet from a string...',
  'b': 'this is a snippet from a string...',
  'c': 'this is a snippet from a string...'
});
console.log(snippets)
// var a = snippets.toSnippets('test/fixtures/a.txt');
// var b = snippets.toSnippet('this is a snippet from a string...');

// var c = snippets.toSnippet(a);
// var d = snippets.toSnippet(b);
// console.log(c)
// console.log(d)
