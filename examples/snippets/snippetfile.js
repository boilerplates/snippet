

module.exports = {
  src: 'templates/*.md',

  options: {
    rename: {

    },
    renameKey: function () {

    }
  }

  snippets: {
    foo: {
      path: '../foo',
      read: function () {}
    },
    header: {
      name: 'header'
    },
    toc: {
      name: 'toc',
      marker: ['<!-- toc -->', '<!-- endtoc -->']
    },
    bar: {},
    baz: {},
  },

  store: {
    base: '/foo',
  }
};
