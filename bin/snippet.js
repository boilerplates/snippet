#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var green = require('ansi-green');
var wrap = require('word-wrap');
var lazy = require('lazy-cache')(require);
var DataStore = lazy('data-store');
var inquirer = lazy('inquirer');
var Snippets = require('../');
var snippets = new Snippets();
var cli = function() {};

if (!snippets.store.has('initialized')) {
  snippetsInit();
}
// 'snippet -g --set=templates:~/templates'

// config api: get, set, del, inject, append, prepend, render, write, copy, cache
var flags = {
  init: 'Re-initialize `snippet`.',
  folder: 'folder of snippets?',
  engine: 'engine preference?',
  global: 'save things globally',
  save: '',
  option: '',
  expand: 'expand an emmet snippet from the command line',
  cache: 'cache a directory of snippets. converts files to JSON objects and stores them on the snippet store.',
  dump: ''
};

cli.on('help', function () {

});

cli.on('init', function () {

});

cli.on('global', function () {

});

cli.on('expand', function () {
 // emmet!
});



var msg = wrap('Since this is your first time running snippets, do you mind answering a few configuration-related questions, so we can try to give you the best experience?', {width: 60});

function snippetsInit() {
  // var inq = inquirer();

console.log(msg);
}

// var choices = {
//   name: 'config',
//   type: 'expand',
//   message: 'Want to cache snippets?',
//   value: 'nothing',
//   choices: [{
//     key: 'n',
//     name: 'do not overwrite',
//     value: 'skip'
//   }, {
//     key: 'y',
//     name: 'overwrite',
//     value: 'write'
//   }, {
//     key: 'a',
//     name: 'overwrite this and all others',
//     value: 'force'
//   }, {
//     key: 'x',
//     name: 'abort',
//     value: 'abort'
//   }, {
//     key: 'd',
//     name: 'diff comparison between the current and new:',
//     value: 'diff'
//   }]
// };

// inq.prompt([choices], function (answers) {

// });
