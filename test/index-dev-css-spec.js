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

    // Create compile function using in-memory fs and dev env.
    compile = lib.createCompileFn(fs, 'development');
  });

  describe('CSS', async function () {
    it('minifies CSS from webpack entry point', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/minify.css'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled));

      assert(!lib.compiledContains(compiled, {
        content: /Resistance is futile./,
      }));
    });

    it('compiles CSS from js entry point', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/main-with-css.js'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled));

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /css-is-da-best/,
        fileName: /\.css$/,
      }));
    });

    it('compiles CSS from webpack entry point', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/main.css'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled));

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /css-is-da-best/,
        fileName: /\.css$/,
      }));
    });

    it('compiles inline CSS within a vue component', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/css-app.vue'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled));

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /details-import-from-css/,
        fileName: /\.css$/,
      }));
    });

    it('compiles imported CSS within a vue component', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/css-app.vue'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled));

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /css-is-da-best/,
        fileName: /\.css$/,
      }));
    });

    it('autoprefixes css', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/autoprefix.css'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled));

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /ms-/,
        fileName: /\.css$/,
      }));
    });

    it('imports css', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/imports.css'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled));

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /css-is-da-best/,
        fileName: /\.css$/,
      }));
    });
  });


  describe('LESS', async function () {
    it('compiles LESS from js entry point', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/main-with-less.js'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled));

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

      assert(lib.compiledWithNoErrors(compiled));

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

      assert(lib.compiledWithNoErrors(compiled));

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

      assert(lib.compiledWithNoErrors(compiled));

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /less-is-da-best/,
        fileName: /\.css$/,
      }));
    });

    it('autoprefixes less', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/autoprefix.less'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled));

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /ms-/,
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

      assert(lib.compiledWithNoErrors(compiled));

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

      assert(lib.compiledWithNoErrors(compiled));

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

      assert(lib.compiledWithNoErrors(compiled));

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /less-is-da-best/,
        fileName: /\.css$/,
      }));
    });

    it('autoprefixes sass', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/styles/autoprefix.scss'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled));

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /ms-/,
        fileName: /\.css$/,
      }));
    });
  });
});
