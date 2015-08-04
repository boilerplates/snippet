'use strict';

var lazy = require('lazy-cache')(require);
var parser = lazy('emmet/lib/parser/abbreviation');
var braces = lazy('braces');

function parse(str) {
  var expanded = parser().expand(str || '').split(/\t/).join('  ');
  var tabs = expanded.match(/\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g) || [];
  var num = 0;

  tabs.forEach(function (stop) {
    expanded = expanded.replace(stop, '__param' + (num++) + '__');
  });
  return expanded;
}

function toObject(arr) {
  var len = arr.length, i = -1;
  var data = {};
  while (++i < len) {
    data['param' + i] = arr[i];
  }
  return data;
}

function toParams(args) {
  if (Array.isArray(args)) {
    return toObject(args);
  }

  if (typeof args === 'object') {
    return args;
  }

  var params = [];
  if (/\*/.test(args)) {
    var parts = args.split('*');
    var num = parts[1];
    var ch = parts[0];
    while (num--) {
      params.push(ch);
    }
  } else {
    if (!/[{}]/.test(args)) {
      args = '{' + args + '}';
    }
    params = braces()(args);
  }
  return toObject(params);
}

function toSnippet(str, data) {
  var parsed = parse(str);
  var ctx = toParams(data);
  return parsed.replace(/__param(\d+)__/g, function (m, num) {
    return ctx['param' + num];
  });
}

function render(str, data, fn) {
  if (typeof data === 'function') {
    fn = data;
    data = {};
  }
  fn = fn || interpolate;
  var parsed = parse(str);
  var params = toParams(data);
  return fn(parsed)(params || {});
}

function interpolate(str) {
  return function (data) {
    return str.replace(/__param(\d+)__/g, function (m, num) {
      var key = 'param' + num;
      return '<%= ' + (data && data[key] ? data[key] : key) + ' %>';
    });
  };
}

// if (argv.data) {
//   var params = getParams(argv.data);
//   if (params) {
//     res = toSnippet(params);
//     console.log(res);
//   }
// } else {
//   console.log(res);
// }


// var snippet = render('!', 'foo,bar', foo);
// var snippet = render('ul>li.item$*5', ['a', 'b', 'c', 'd', 'e']);
// var snippet = render('!', ['title', 'body']);
// var snippet = render('#menu$*2>ul>li*5>a', '#{a..c}{a..d}{a..j}/');
// var snippet = render('#{}menu$>ul.{}>li>a', 'foo,bar,/index.html,Home');
// var snippet = render('#page>div.logo+ul#navigation>li*5>a{Item $}');
// console.log(snippet)
// function expand(str) {
//   return parser.expand(str).split('\t').join('  ');
// }

// console.log(expand('table>tr.row*4>td.data{inner $}*3'))
// console.log(expand('ul>li*3>lipsum4$0'))
// console.log(expand('#menu$*2>ul>li*5>a'))

module.exports = render;



