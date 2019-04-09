/* eslint arrow-body-style: ["error", "as-needed"] */
const path = require('path');
const MemoryFS = require('memory-fs');
const R = require('ramda');
const febsModule = require('../../index');

module.exports = {

  compiledWithNoErrors: compiled => compiled.stats.compilation.errors.length === 0,

  compiledContains: (compiled, opts) => {
    if (!opts.entryName && !opts.entryName && !opts.content) throw new Error('all arguments required');

    for (var i = 0; i < compiled.code.length; i++) {
      if (compiled.code[i] && compiled.code[i][opts.entryName]) {
        const res = compiled.code[i][opts.entryName]
          .filter(emitted => opts.fileName.test(emitted.filename))
          .filter(emitted => opts.content.test(emitted.content))

        if (res.length > 0) {
          return true;
        }

      }
    }

  },

  // Set up an in-memory file system for tests.
  createFS: () => new MemoryFS(),

  /**
   * Utility to create webpack conf override fragment.
   * @param {*} obj Object to add to override fragment, typically
   * the entry.
   */
  createConf: obj => Object.assign({}, obj, {}),

  /**
   * Webpack curried compile helper for unit tests.
   * Sets up and runs webpack with in-memory file system.
   *
   * @param {Object} fs The memory-fs instance.
   * @param {Object} conf The override conf object.
   * @return {Promise}  Promise resolving with an object containing
   *                    compiled code and webpack output.
   */

  createCompileFn: R.curry((fs, conf) => new Promise((resolve, reject) => {
    // create compiler instance
    const febs = febsModule({
      fs,
    });

    const compiler = febs.createCompiler(conf);

    // Set up in-memory file system for tests.
    compiler.outputFileSystem = fs;

    // Run webpack
    compiler.run((err, stats) => {
      const webpackResults = febs.webpackCompileDone(err, stats);

      // Syntax errors are in stats object.
      const { entrypoints, errors, warnings } = stats.toJson('verbose');

      if (errors.length > 0 || warnings.length > 0) {
        return resolve({
          err,
          stats,
          code: null,
          options: compiler.options,
          exitCode: webpackResults.exitCode,
        });
      }

      // Reject webpack errors
      if (err) return reject(err);

      // Resolve with wp compile results.
      const code = Object.keys(entrypoints).map((key) => { // key is entrypoint key (e.g. "app")
        const res = {};
        res[key] = []; // an array of built assets will be under the key

        const { assets } = entrypoints[key]; // array of assets under that key.
        assets.forEach((asset) => {
          res[key].push({
            filename: asset,
            content: fs.readFileSync(path.resolve(`${compiler.outputPath}/${asset}`), 'utf8'),
          });
        });

        return res;
      });


      const code2 = R.mergeAll(code);

      return resolve({
        err,
        stats,
        code,
        code2,
        options: compiler.options,
        exitCode: webpackResults.exitCode,
      });
    });
  })),

  // Absolute path relative to the /test dir.
  absPath: relPath => path.resolve(__dirname, '..', relPath),

  /**
   * Helper to return json object from a file of json content.
   * filePath -> Object
   * @param String The path to file.
   * @returns Object The json object.
   */
  getJsonFromFile: fs => R.compose(
    JSON.parse,
    file => fs.readFileSync(file, 'utf8')
  ),
};
