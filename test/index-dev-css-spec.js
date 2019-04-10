/* eslint-env node, mocha */
/* eslint-disable prefer-arrow-callback, func-names */

// Dependencies.
const assert = require('assert');
const lib = require('./lib');

describe('CSS Tests', function () {
  let compile;
  let fs;

  beforeEach(function () {
    process.env.FEBS_TEST = true;

    // Keep reference to fs for test assertions.
    fs = lib.createFS();

    // Create compile function using in-memory fs.
    compile = lib.createCompileFn(fs);
  });

  // @TODO: tests for vanilla CSS

  describe('LESS', async function () {
    it('compiles LESS from js entry point', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/main-with-less.js'),
        },
      }));

      // fail on compilation errors and show the error verbosely
      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /border-color/,
        fileName: /\.css$/,
      }));
    });

    it('compiles LESS from webpack entry point', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/main.less'),
        },
      }));

      // fail on compilation errors and show the error verbosely
      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /less-is-da-best/,
        fileName: /\.css$/,
      }));
    });

    it('compiles inline LESS within a vue component', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/less-app.vue'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /details-import-from-css/,
        fileName: /\.css$/,
      }));
    });

    it('compiles imported LESS within a vue component', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/less-app.vue'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /less-is-da-best/,
        fileName: /\.css$/,
      }));
    });
  });

  describe('SCSS', async function () {
    it('compiles SCSS from js entry point', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/main-with-scss.js'),
        },
      }));

      // fail on compilation errors and show the error verbosely
      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /some-color-scss/,
        fileName: /\.css$/,
      }));
    });

    it('compiles inline SCSS within a vue component', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/scss-app.vue'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /cool-scss/,
        fileName: /\.css$/,
      }));
    });

    it('compiles imported LESS within a vue component', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/less-app.vue'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /less-is-da-best/,
        fileName: /\.css$/,
      }));
    });
  });
});
