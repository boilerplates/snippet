var Snippet = require('../lib/snippet');
var snippet = new Snippet({content: 'write test'});

snippet.dest('test/actual/write.txt');
snippet.write({ask: false}, function (err) {

});
