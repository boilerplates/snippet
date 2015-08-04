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
  .fetch('/assemble/assemble/v0.6.0/.verb.md', {preset: 'github'})
  .download(function (err, dest) {
    if (err) console.error(err);
    console.log('saved to:', dest);
    return this;
  })
  .fetch('/jonschlinkert/template/master/.verb.md', {preset: 'github'})
  .download(function (err, dest) {
    if (err) console.error(err);
    console.log('saved to:', dest);
  })
