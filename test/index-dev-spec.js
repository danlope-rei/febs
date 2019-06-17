/* eslint-env node, mocha */
/* eslint-disable prefer-arrow-callback, func-names */

// Dependencies.
const assert = require('assert').strict;
const path = require('path');
const sinon = require('sinon');
const lib = require('./lib');
const webpack = require('webpack');
const fsExtra = require('fs-extra');

// Dependencies used by tests assertions
const devServerFn = require('../lib/dev-server');
const logger = require('../lib/logger');
const wpDevConf = require('../webpack-config/webpack.base.conf');
const febsModule = require('../index');

describe('FEBS Development Tests', function () {
  let compile;
  let fs;

  logger.setLogLevel('warn'); // Suppress info messages

  beforeEach(function () {
    process.env.FEBS_TEST = true;

    // Keep reference to fs for test assertions.
    fs = lib.createFS();

    // Create compile function using in-memory fs.
    compile = lib.createCompileFn(fs);
  });

  describe('ECMAScript', async function () {
    it('builds ES bundle', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/main-es2015.js'),
        },
      }));

      assert.equal(compiled.code.app[0].filename, 'app.bundle.js');
      assert(compiled.code.app[0].content.includes('add: function add()'));
    });

    it('transpiles ES from @rei namespace only', async function () {
      // Create temp @rei and non-@rei namespace modules in node_modules
      const srcReiNamespace = path.join(__dirname, 'test-modules/@rei');
      const destReiNamespace = path.join(__dirname, '../node_modules/@rei');
      const srcNonReiNamespace = path.join(__dirname, 'test-modules/some-module');
      const destNonReiNamespace = path.join(__dirname, '../node_modules/some-module');

      fsExtra.copySync(srcReiNamespace, destReiNamespace);
      fsExtra.copySync(srcNonReiNamespace, destNonReiNamespace);

      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/main-es2015-rei-namespace.js'),
        },
      }));

      // @rei namespace should be transpiled
      assert(compiled.code.app[0].content.includes('add3: function add3'));

      // non-@rei namespace should not be transpiled
      assert(!compiled.code.app[0].content.includes('add4: function add4'));

      // Cleanup temp modules
      fsExtra.removeSync(destReiNamespace);
      fsExtra.removeSync(destNonReiNamespace);
    });

    it('builds multiple ES bundles', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app1: lib.absPath('fixtures/src/main-es2015.js'),
          app2: lib.absPath('fixtures/src/main-es2015.js'),
        },
      }));

      assert(lib.compiledContains(compiled, {
        entryName: /app1/,
        content: /unction add/,
        fileName: /\.js$/,
      }));

      assert(lib.compiledContains(compiled, {
        entryName: /app2/,
        content: /unction add/,
        fileName: /\.js$/,
      }));
    });

    it('detects ES syntax errors', async function () {
      await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/main-es2015-syntax-errors.js'),
        },
      })).then((o) => {
        assert.ok(o.stats.compilation.errors[0].message.includes('Unexpected token'));
      });
    });

    it('polyfills based on supported browsers (IE11)', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app1: lib.absPath('fixtures/src/main-es-polyfill.js'),
        },
      }));

      // Object.assign
      assert(lib.compiledContains(compiled, {
        entryName: /app1/,
        content: /es6.object.assign/,
        fileName: /\.js$/,
      }));

      // Promise
      assert(lib.compiledContains(compiled, {
        entryName: /app1/,
        content: /es6.promise/,
        fileName: /\.js$/,
      }));
    })
  });


  describe('Vue', function () {
    it('compiles Vue tags', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/vue/main-vue.js'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /Vue says/,
        fileName: /\.js$/,
      }));
    });

    it('extracted external vue css styles and put into app css file', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/vue/main-vue.js'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /papayawhip/,
        fileName: /\.css$/,
      }));
    });

    it('extracted inline vue css styles and put into app css file', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/vue/main-vue.js'),
        },
      }));

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /red/,
        fileName: /\.css$/,
      }));

      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);
    });

    it('transpiles es2015+ Vue tags', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/vue/main-vue.js'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);

      assert(lib.compiledContains(compiled, {
        entryName: /^app$/,
        content: /function helloWorld/,
        fileName: /\.js$/,
      }));
    });

    it('detects Vue JavaScript syntax errors', async function () {
      await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/vue/main-vue-syntax-error.js'),
        },
      })).then((o) => {
        assert.ok(o.stats.compilation.errors[0].message.includes('SyntaxError'));
      });
    });
  });

  describe('Sourcemaps', async function () {
    it('generates inline ES sourcemaps', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/main-es2015.js'),
        },
      }));

      assert(compiled.code.app[0].content.includes('sourceURL'));
    });
  });

  describe('Helpers', function () {
    describe('febsConfigMerge', function () {
      it('should override output path from febs-config', function () {
        const febs = febsModule({
          fs,
        });

        const febsConfig = {
          output: {
            path: 'a',
          },
        };

        const wpConfig = {
          output: {
            path: 'b',
          },
        };

        const expected = path.resolve(process.cwd(), febsConfig.output.path, '@rei/febs');
        assert.deepEqual(febs.febsConfigMerge(febsConfig, wpConfig).output.path, expected);
      });

      it('should use default output path if none in febs-config', function () {
        const febs = febsModule({
          fs,
        });

        const febsConfig = {
          entry: {},
        };

        const wpConfig = {
          output: {
            path: 'b',
          },
        };

        const expected = path.resolve(process.cwd(), wpConfig.output.path, '@rei/febs');
        assert.deepEqual(febs.febsConfigMerge(febsConfig, wpConfig).output.path, expected);
      });

      it('should update wpConfig entry with fully qualified paths', function () {
        const febs = febsModule({
          fs,
        });

        const febsConfig = {
          entry: {
            details: [
              'relative/path/to/entry0.js',
              'relative/path/to/entry1.js',
            ],
          },
        };

        const wpConfig = {
          entry: {
            app: [
              'some/path/to/entry.js',
            ],
          },
          output: {
            path: 'b',
          },
        };

        const expected0 = path.resolve(process.cwd(), febsConfig.entry.details[0]);
        const expected1 = path.resolve(process.cwd(), febsConfig.entry.details[1]);
        assert.deepEqual(febs.febsConfigMerge(febsConfig, wpConfig).entry.details[0], expected0);
        assert.deepEqual(febs.febsConfigMerge(febsConfig, wpConfig).entry.details[1], expected1);
      });

      it('original webpack config should not be modified', function () {
        const febs = febsModule({
          fs,
        });

        const febsConfig = {
          entry: {
            details: [
              'relative/path/to/entry0.js',
              'relative/path/to/entry1.js',
            ],
          },
        };

        const wpConfig = {
          entry: {
            app: [
              'some/path/to/entry.js',
            ],
          },
          output: {
            path: 'b',
          },
        };

        febs.febsConfigMerge(febsConfig, wpConfig);

        assert.equal(wpConfig.output.path, 'b');
        assert.deepEqual(wpConfig.entry.app, ['some/path/to/entry.js']);
      });
    });
  });

  describe('Manifest', async function () {
    it('generates a manifest json file for versioned asset mappings', async function () {
      const getJsonFromFS = lib.getJsonFromFile(fs);

      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/main-es2015.js'),
        },
      }));

      assert(lib.compiledWithNoErrors(compiled), compiled.stats.compilation.errors);

      const manifestFile = path.resolve(compiled.options.output.path, 'febs-manifest.json');
      assert(fs.statSync(manifestFile).isFile());

      const manifestJson = getJsonFromFS(manifestFile);
      assert.equal(manifestJson['app.js'], 'app.bundle.js');
    });
  });

  describe('Logger', function () {
    it('should contain setLogLevel function', function () {
      assert(logger.setLogLevel);
    });

    it('allow changing log levels', function () {
      logger.setLogLevel('warn');
      assert.equal(logger.transports.console.level, 'warn');
    });
  });

  describe('addVueSSRToWebpackConfig', function () {
    it('should add VueSSRServerPlugin to webpack config', function () {
      const febs = febsModule({
        fs,
      });

      const wpConfig = febs.addVueSSRToWebpackConfig(true, wpDevConf);

      assert(wpConfig.plugins.some(plugin => plugin.constructor.name === 'VueSSRServerPlugin'));
      assert.equal(wpConfig.output.libraryTarget, 'commonjs2');
    });

    it('should not add VueSSRServerPlugin', function () {
      const febs = febsModule({
        fs,
      });

      const wpConfig = febs.addVueSSRToWebpackConfig(false, wpDevConf);

      assert(wpConfig.plugins.every(plugin => plugin.constructor.name !== 'VueSSRServerPlugin'));
    });
  });

  describe('getWebpackConfig', function () {
    it('should not return multiple plugin entries after merging confs', function () {
      const febs = febsModule({
        fs,
      });
      const expectedLength = wpDevConf.module.rules.length;
      const wpConfig = febs.getWebpackConfig(false)(wpDevConf);
      assert.equal(expectedLength, wpConfig.module.rules.length);
    });

    it('should not contain ManifestPlugin if SSR build', function () {
      const febs = febsModule({
        fs,
      });

      const wpConfig = febs.getWebpackConfigCurried(true)(wpDevConf);
      assert(wpConfig.plugins.every(plugin => plugin.constructor.name !== 'ManifestPlugin'));
    });

    it('should contain ManifestPlugin if not SSR build', function () {
      const febs = febsModule({
        fs,
      });

      const wpConfig = febs.getWebpackConfigCurried(false)(wpDevConf);
      assert(wpConfig.plugins.some(plugin => plugin.constructor.name === 'ManifestPlugin'));
    });
  });

  describe('Webpack config', async function () {
    it('Output path cannot be modified', async function () {
      const compiled = await compile(lib.createConf({
        entry: {
          app: lib.absPath('fixtures/src/main-es2015.js'),
        },
        output: {
          path: lib.absPath('build/modified-output-path'),
        },
      }));

      assert(!compiled.options.output.path.includes('build/modified-output-path'));
    });
  });

  describe('febs-config', function () {
    it('should allow dist path to be changed', function () {
      const desiredOutputPath = path.resolve('./cool_output_path');

      const febs = febsModule('build', {
        output: {
          path: desiredOutputPath,
        },
        fs,
      });

      const webpackConfig = febs.getWebpackConfig(false)(wpDevConf);

      assert.equal(webpackConfig.output.path, path.resolve(desiredOutputPath, '@rei', 'febs'));
    });

    it('should allow entry points to be changed', function () {
      const desiredEntryPath = 'src/js/entryX.js';

      const webpackConfig = febsModule('build', {
        entry: {
          app: [
            desiredEntryPath,
          ],
        },
        fs,
      }).getWebpackConfig(false)(wpDevConf);

      assert(webpackConfig.entry.app[0].endsWith(desiredEntryPath));
    });

    describe('febsConfigMerge', function () {
      it('should override output path from febs-config', function () {
        const febs = febsModule({
          fs,
        });

        const febsConfig = {
          output: {
            path: 'a',
          },
        };

        const wpConfig = {
          output: {
            path: 'b',
          },
        };

        const expected = path.resolve(process.cwd(), febsConfig.output.path, '@rei/febs');
        assert.deepEqual(febs.febsConfigMerge(febsConfig, wpConfig).output.path, expected);
      });

      it('should use default output path if none in febs-config', function () {
        const febs = febsModule({
          fs,
        });

        const febsConfig = {
          entry: {},
        };

        const wpConfig = {
          output: {
            path: 'b',
          },
        };

        const expected = path.resolve(process.cwd(), wpConfig.output.path, '@rei/febs');
        assert.deepEqual(febs.febsConfigMerge(febsConfig, wpConfig).output.path, expected);
      });

      it('should update wpConfig entry with fully qualified paths', function () {
        const febs = febsModule({
          fs,
        });

        const febsConfig = {
          entry: {
            details: [
              'relative/path/to/entry0.js',
              'relative/path/to/entry1.js',
            ],
          },
        };

        const wpConfig = {
          entry: {
            app: [
              'some/path/to/entry.js',
            ],
          },
          output: {
            path: 'b',
          },
        };

        const expected0 = path.resolve(process.cwd(), febsConfig.entry.details[0]);
        const expected1 = path.resolve(process.cwd(), febsConfig.entry.details[1]);
        assert.deepEqual(febs.febsConfigMerge(febsConfig, wpConfig).entry.details[0], expected0);
        assert.deepEqual(febs.febsConfigMerge(febsConfig, wpConfig).entry.details[1], expected1);
      });

      it('original webpack config should not be modified', function () {
        const febs = febsModule({
          fs,
        });

        const febsConfig = {
          entry: {
            details: [
              'relative/path/to/entry0.js',
              'relative/path/to/entry1.js',
            ],
          },
        };

        const wpConfig = {
          entry: {
            app: [
              'some/path/to/entry.js',
            ],
          },
          output: {
            path: 'b',
          },
        };

        febs.febsConfigMerge(febsConfig, wpConfig);

        assert.equal(wpConfig.output.path, 'b');
        assert.deepEqual(wpConfig.entry.app, ['some/path/to/entry.js']);
      });
    });
  });

  describe('Exit codes', function () {
    it('should not return exit code 1 in dev mode so that watching persists)', async function () {
      await compile(lib.createConf({
        entry: {
          app1: lib.absPath('fixtures/src/main-es2015-syntax-errors.js'),
        },
      })).then((o) => {
        assert.equal(o.exitCode, 0);
      });
    });
  });

  describe('Dev Server', function () {
    // So we aren't starting an actual server during unit tests.
    let FakeWDS;

    beforeEach(() => FakeWDS = function (compiler) {
      this.listen = () => {
      };
      this.compiler = compiler;
    });

    it('should create new server', function () {
      const devServer = devServerFn(FakeWDS, () => {
      });
      assert(devServer instanceof FakeWDS);
    });

    it('should pass in compiler and webpack conf', function () {
      const febs = febsModule('dev', {
        fs,
      });

      // Assert dev server returned
      const devServer = febs.startDevServerFn(FakeWDS)();
      assert(devServer instanceof FakeWDS);

      // Assert webpack compiler passed to FakeWDS
      assert(devServer.compiler instanceof webpack.Compiler);
    });
  });
});
