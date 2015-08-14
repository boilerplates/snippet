var Snippets = require('..');
var snippets = new Snippets({destBase: 'test/actual/fetched'});

snippets.preset('github', {
  url: 'https://raw.githubusercontent.com',
  fn: function (preset, config) {
    config.pathname = config.url.split('/').slice(-3).join('_');
    return preset.url;
  }
});

snippets
  .queue('/assemble/assemble/v0.6.0/.verb.md', { preset: 'github' })
  .fetch(function (err, dest) {
    if (err) console.error(err);
    console.log('saved to:', dest);
    return this;
  })
  .queue('/jonschlinkert/template/master/.verb.md', { preset: 'github' })
  .fetch(function (err, dest) {
    if (err) console.error(err);
    console.log('saved to:', dest);
  })
