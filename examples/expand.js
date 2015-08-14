var Snippets = require('../');
var snippets = new Snippets();

console.log(snippets.expand('ul>li.item$*3'));
console.log(snippets.expand('ul>li.item$*3', ['a', 'b', 'c']));
