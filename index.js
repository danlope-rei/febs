/* eslint-disable global-require, import/no-dynamic-require, no-nested-ternary */

const wp = require('webpack');
const R = require('ramda');
const path = require('path');
const merge = require('webpack-merge');
const fsExtra = require('fs-extra');
const { baseConfigFn, ssrConfig } = require('@rei/front-end-build-configs').profiles.application;
const logger = require('./lib/logger');
const lib = require('./lib');
const devServer = require('./lib/dev-server');

const projectPath = process.cwd();

/**
 * FEBS entry point. The module is initialized with the
 * conf entries from bin/febs.
 *
 * Passed in at run or test time
 * @param conf
 * @param conf.env The environment (dev or prod)
 * @param conf.logLevel The log level.
 * @param command The command from commander.
 * passed in at test-time
 * @param conf.fs The file system (passed in from unit tests.)
 */
module.exports = function init(command, conf = {}) {
  const febsConfigArg = conf;

  // Get the build environment. (prod | dev)
  const env = command.name
    ? command.name() === 'prod'
      ? 'production'
      : 'development'
    : conf.env; // <-- Passed in to set env during unit tests.

  // Allow for in-memory fs for testing.
  const fs = conf.fs || require('fs');

  if (conf.logLevel) logger.setLogLevel(conf.logLevel);

  // Get local overrides WP conf.
  const getOverridesConf = (confOverride) => {
    if (confOverride) return confOverride;

    const overridesConfFile = path.resolve(projectPath, './webpack.overrides.conf.js');

    if (fs.existsSync(overridesConfFile)) {
      logger.info('Using local webpack.overrides.conf.js...');

      const overridesConf = require(overridesConfFile);

      // Warn if overriding output path
      if (R.hasPath(['output', 'path'], overridesConf)) {
        logger.warn('Overriding the output path may break upstream expectations of asset locations.');
      }

      return overridesConf;
    }

    return {};
  };

  const memoize = fn => R.memoizeWith(R.identity, fn);

  const febsConfigPath = path.resolve(projectPath, './febs-config.json');
  const readJson = memoize(filePath => fsExtra.readJsonSync(filePath));
  const getFebsConfigJson = readJson.bind(null, febsConfigPath);

  const getFebsConfig = (febsConfig = {}) => {
    let febsConfigFileJSON;
    if (fs.existsSync(febsConfigPath)) {
      febsConfigFileJSON = getFebsConfigJson();
    } else if (febsConfigArg && (febsConfigArg.output || febsConfigArg.entry)) {
      febsConfigFileJSON = febsConfigArg;
    }

    if (febsConfigFileJSON) {
      logger.info('Using local febs-config.json...');
      logger.warn('Entries in febs-config.json will override those in webpack.overrides.conf.js.');
    }

    return R.merge(febsConfig, febsConfigFileJSON);
  };

  const isSSR = () => getFebsConfig().ssr;

  const getPackageName = () => {
    const projectPackageJson = path.join(projectPath, 'package.json');
    return require(projectPackageJson).name;
  };

  /**
   * Applies febs-config to the webpack configuration
   * @param febsConfig The febs-config.json object.
   * @param wpConf The webpack config.
   * @returns {object} The webpack config with merged febs-config object.
   */
  const febsConfigMerge = (febsConfig, wpConf) => {
    // Update the output.path to what is in febs-config
    const newOutputPath = R.hasPath(['output', 'path'], febsConfig)
      ? path.resolve(projectPath, febsConfig.output.path, getPackageName())
      : wpConf.output.path;

    const wpConfNewOutputPath = R.mergeDeepRight(wpConf, {
      output: {
        path: newOutputPath,
      },
    });

    // If febsConfig.entry, replace wpConf.entry with it using fully qualified paths.
    if (febsConfig.entry) {
      const { entry } = febsConfig;
      const newEntries = R.zipObj(
        R.keys(entry),
        R.values(entry).map(
          entryArr => entryArr.map(
            entryPath => path.resolve(projectPath, entryPath)
          )
        )
      );

      return R.merge(R.dissoc('entry', wpConfNewOutputPath), {
        entry: newEntries,
      });
    }

    return wpConfNewOutputPath;
  };

  /**
   * Modifications needed for SSR.
   *
   * @param ssr
   * @param wpConf
   * @returns {*}
   */
  const addVueSSRToWebpackConfig = R.curry((ssr, wpConf) => {
    if (!ssr) {
      return wpConf;
    }

    const pluginsToRemove = ['ManifestPlugin', 'CleanWebpackPlugin'];

    // Remove above plugins during SSR build.
    const plugins = wpConf.plugins
      .filter(plugin => !pluginsToRemove.includes(plugin.constructor.name));

    const pluginsFiltered = R.merge(R.dissoc('plugins', wpConf), {
      plugins,
    });

    // Add SSR config.
    return merge.smartStrategy({
      entry: 'replace',
      plugins: 'append',
    })(pluginsFiltered, ssrConfig);
  });

  /**
   * Get the webpack config using:
   *  - webpack.base.conf.js
   *  - confOverrides
   *  - febs-config.json
   *
   * @param confOverride Optional conf overrides that comes in either from
   * webpack.overrides.conf or from unit tests.
   */
  const getWebpackConfigBase = memoize((confOverride) => {
    const webpackConfigBase = baseConfigFn(env);

    logger.info(`Building in webpack ${webpackConfigBase.mode} mode...`);

    const configsToMerge = [webpackConfigBase];

    // Config for webpack-merge
    const wpMergeConf = {
      entry: 'replace',
    };

    // Overrides config.
    configsToMerge.push(getOverridesConf(confOverride));

    const wpConf = merge.smartStrategy(wpMergeConf)(configsToMerge);

    // Ensure febs config makes the final configurable decisions
    return febsConfigMerge(getFebsConfig(), wpConf);
  });

  /**
   * Get the webpack config. This depends upon:
   *  - the base webpack config.
   *  - the webpack server config for optional SSR (ssr property in febs-config)
   *  - any other overrides coming in from febs-config.json.
   *  - optional overrides passed in from unit tests.
   */
  const getWebpackConfigFn = ssr => R.compose(
    addVueSSRToWebpackConfig(ssr),
    getWebpackConfigBase
  );

  /**
   * Configure
   * @param ssr Whether or not to include SSR webpack build config.
   * @returns {function} A function that takes overrides argument
   * and returns the final webpack config.
   */
  const getWebpackConfig = ssr => getWebpackConfigFn(ssr);

  /**
   * Create's compiler instance with appropriate environmental
   * webpack.conf merged with the webpack.overrides/febs-config/SSR configs.
   *
   * @param {WebpackOptions} wpConf The final webpack config object.
   * @return {Object} The webpack compiler instance.
   */
  const createWebpackCompiler = wpConf => wp(wpConf);

  /**
   * Create the webpack compiler.
   * @param {boolean} ssr Whether or not to include Vue SSR build.
   */
  const createCompiler = ssr => R.compose(
    createWebpackCompiler,
    getWebpackConfig(ssr)
  );

  /**
   * The webpack run callback.
   * @param err
   * @param stats
   * @returns {{err: *, stats: *, exitCode: number}}
   */
  const webpackCompileDone = (err, stats) => {
    // Log results
    if (!process.env.FEBS_TEST) {
      logger.info(stats.toString({
        chunks: false,
        colors: true,
      }));
    }

    // No errors.
    if (stats.compilation.errors && stats.compilation.errors.length === 0) {
      return {
        err,
        stats,
        exitCode: 0,
      };
    }

    // If dev mode, do not exit as it will kill watcher.
    if (env === 'development') {
      return {
        err,
        stats,
        exitCode: 0,
      };
    }

    // Syntax and/or parse errors.
    // Set error exit code to fail external build tools.
    process.exitCode = 1;
    return {
      err,
      stats,
      exitCode: 1,
    };
  };

  /**
   * Runs the webpack compile either via 'run' or 'watch'.
   * @param ssr Whether or not to run SSR build.
   * @returns The webpack compiler instance.
   */
  const runCompile = (ssr) => {
    const compilerFn = command.watch ? 'watch' : 'run';

    const compiler = createCompiler(ssr)();

    logger.info(`Compiling ${ssr ? 'SSR build' : 'client-side bundles'}:`);

    if (!ssr) {
      Object.keys(compiler.options.entry).forEach(e => logger.info(`   ✔ ${e}`));
    }

    logger.info(`📝 Writing ${ssr ? 'vue-ssr-server-bundle.json' : 'assets'} to: ${path.relative(projectPath, compiler.outputPath)}...`);

    if (compilerFn === 'run') {
      compiler[compilerFn](webpackCompileDone);
    } else {
      compiler[compilerFn]({/* watch options */}, webpackCompileDone);
    }
    return compiler;
  };

  /**
   * Clean the build destination directory.
   */
  const cleanDestDir = fsExtra.emptyDirSync.bind(null, getWebpackConfigBase().output.path);

  /**
   * Compile function.
   *
   * - Creates compiler with config object
   * - Runs via webpack run/watch methods
   * - Handles the various WP errors.
   *
   * @returns {Object} Webpack compiler instance.
   */
  const compile = function compile() {
    cleanDestDir();

    // Create client-side bundle
    runCompile(false);

    // If SSRing, create vue-ssr-server-bundle.json.
    if (isSSR()) {
      runCompile(true);
    }
  };

  /**
   * Start the webpack dev server
   * @param wds Optionally pass in fake wds (UT only)
   */
  const startDevServerFn = wds => R.compose(
    devServer.bind(null, wds),
    createCompiler(false),
  );

  return {
    compile,
    createCompiler,
    webpackCompileDone,
    startDevServerFn,
    getWebpackConfig,
    addVueSSRToWebpackConfig,
    getWebpackConfigFn,
    febsConfigMerge,
  };
};
