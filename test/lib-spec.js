/* eslint-env node, mocha */
/* eslint-disable prefer-arrow-callback, func-names */

const assert = require('assert');
const lib = require('./lib');

describe('FEBS Lib Tests', function () {
  let compile;
  beforeEach(function () {
    process.env.FEBS_TEST = true;
    compile = lib.createCompileFn(lib.createFS());
  });

  it('positively asserts against entryName, fileName, content', async function () {
    const compiled = await compile(lib.createConf({
      entry: {
        app1: lib.absPath('fixtures/src/main-es2015.js'),
      },
    }));

    // .code.app1[0].content.includes('add:function')
    assert(lib.compiledContains(compiled, {
      entryName: /app1/,
      fileName: /\.js$/,
      content: /ction/,
    }));
  });

  it('negatively asserts entryName', async function () {
    const compiled = await compile(lib.createConf({
      entry: {
        app1: lib.absPath('fixtures/src/main-es2015.js'),
      },
    }));

    // .code.app1[0].content.includes('add:function')
    assert(!lib.compiledContains(compiled, {
      entryName: /appx/,
      fileName: /\.js$/,
      content: /ction/,
    }));
  });

  it('negatively asserts content', async function () {
    const compiled = await compile(lib.createConf({
      entry: {
        app1: lib.absPath('fixtures/src/main-es2015.js'),
      },
    }));

    // .code.app1[0].content.includes('add:function')
    assert(!lib.compiledContains(compiled, {
      entryName: /app/,
      fileName: /\.js$/,
      content: /xtion/,
    }));
  });

  it('matches filename only', async function () {
    const compiled = await compile(lib.createConf({
      entry: {
        app1: lib.absPath('fixtures/src/main-es2015.js'),
      },
    }));

    // .code.app1[0].content.includes('add:function')
    assert(lib.compiledContains(compiled, {
      fileName: /\.js$/,
    }));
  });

  it('matches content only', async function () {
    const compiled = await compile(lib.createConf({
      entry: {
        app1: lib.absPath('fixtures/src/main-es2015.js'),
      },
    }));

    // .code.app1[0].content.includes('add:function')
    assert(lib.compiledContains(compiled, {
      content: /add: function/,
    }));
  });
});
