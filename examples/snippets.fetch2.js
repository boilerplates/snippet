var Snippets = require('..');
var snippets = new Snippets({destBase: 'test/actual/fetched'});

snippets.downloader.preset('github', {
  url: 'https://raw.githubusercontent.com',
  fn: function (preset, config) {
    config.pathname = config.url.split('/').slice(-3).join('_');
    return preset.url;
  }
});

snippets.downloader
  .queue('/assemble/assemble/v0.6.0/.verb.md', {preset: 'github'})
  .queue('/jonschlinkert/template/master/.verb.md', {preset: 'github'})
  .queue('/verbose/verb/master/.verb.md', {preset: 'github'})
  // .dest('.verb.md')
  .fetch(function (err) {
    if (err) console.error(err);
  })
