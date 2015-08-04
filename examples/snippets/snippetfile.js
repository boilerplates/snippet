

module.exports = {
  src: 'templates/*.md',

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
