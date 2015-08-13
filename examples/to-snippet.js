var engine = require('engine');
var Snippet = require('../lib/snippet');

var snippet = new Snippet();

var a = snippet.toSnippet('test/fixtures/a.txt');
var b = snippet.toSnippet('this is a snippet from a string...');

var c = snippet.toSnippet(a);
console.log(c)
var d = snippet.toSnippet(b);
console.log(d)
