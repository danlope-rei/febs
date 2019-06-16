/* eslint-disable global-require, import/no-dynamic-require */

const wp = require('webpack');
const R = require('ramda');
const path = require('path');
const merge = require('webpack-merge');
const logger = require('./lib/logger');
const lib = require('./lib');
const devServer = require('./lib/dev-server');
const fsExtra = require('fs-extra');

const projectPath = process.cwd();

/**
 * FEBS entry point. The module is initialized with the
 * conf entries from bin/febs.
 *
 * Passed in at run or test time
 * @param conf.env The environment (dev or prod)
 * @param command The command from commander.
 * passed in at test-time
 * @param conf.fs The file system (passed in from unit tests.)
 */
module.exports = function init(command, conf = {}) {
  const febsConfigArg = conf;

  // Allow for in-memory fs for testing.
  const fs = conf.fs || require('fs');

  if (conf.logLevel) logger.setLogLevel(conf.logLevel);

  // Get local overrides WP conf.
  const getOverridesConf = (confOverride) => {
    if (confOverride) return confOverride;

    const overridesConfFile = path.resolve(projectPath, './webpack.overrides.conf.js');

    if (fs.existsSync(overridesConfFile)) {
      logger.info('Using webpack.overrides.conf: ', overridesConfFile);
      return require(overridesConfFile);
    }

    return {};
  };

  const getFebsConfigDefaults = () => ({
    output: {
      path: './dist',
    },
  });

  const getFebsConfig = () => {
    const febsConfig = getFebsConfigDefaults();

    const febsConfigPath = path.resolve(projectPath, './febs-config.json');

    let febsConfigFileJSON;
    if (fs.existsSync(febsConfigPath)) {
      febsConfigFileJSON = require(febsConfigPath);
    } else if (febsConfigArg && (febsConfigArg.output || febsConfigArg.entry)) {
      febsConfigFileJSON = febsConfigArg;
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
    const wpConfNewOutputPath = R.mergeDeepRight(wpConf, {
      output: {
        path: path.resolve(projectPath, febsConfig.output.path, getPackageName()),
      },
    });

    // If febsConfig.entry, replace wpConf.entry with it using fully qualified paths.
    if (febsConfig.entry) {
      const { entry } = febsConfig;
      const newEntries = R.zipObj(
        R.keys(entry),
        R.values(entry).map(
          entryArr => entryArr.map(entryPath => path.resolve(projectPath, entryPath))
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

    // Remove Manifest plugin during SSR build.
    const plugins = wpConf.plugins
      .filter(plugin => plugin.constructor.name !== 'ManifestPlugin');

    const wpConfNoManifest = R.merge(R.dissoc('plugins', wpConf), {
      plugins,
    });

    // Add SSR config.
    const webpackServerConf = require('./webpack-config/webpack.server.conf');
    return merge.smartStrategy({
      entry: 'replace',
      plugins: 'append',
    })(wpConfNoManifest, webpackServerConf);
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
  const getWebpackConfigBase = (confOverride) => {
    const webpackConfigBase = require('./webpack-config/webpack.base.conf');
    const configsToMerge = [webpackConfigBase];

    // Config for webpack-merge
    const wpMergeConf = {
      entry: 'replace',
    };

    // Overrides config.
    configsToMerge.push(getOverridesConf(confOverride));

    const wpConf = merge.smartStrategy(wpMergeConf)(configsToMerge);

    // Force output path to always be the same. (Overrideable in febs-config)
    wpConf.output.path = webpackConfigBase.output.path;

    // Ensure febs config makes the final configurable decisions
    return febsConfigMerge(getFebsConfig(), wpConf);
  };

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
    if (process.env.NODE_ENV === 'dev') {
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
   * Clean the build destination directory.
   */
  const cleanDestDir = fsExtra.emptyDirSync.bind(null, getWebpackConfig(false)().output.path);

  /**
   * Runs the webpack compile either via 'run' or 'watch'.
   * @param ssr Whether or not to run SSR build.
   * @returns The webpack compiler instance.
   */
  const runCompile = (ssr) => {
    const compilerFn = command.watch ? 'watch' : 'run';

    const compiler = createCompiler(ssr)();

    if (compilerFn === 'run') {
      compiler[compilerFn](webpackCompileDone);
    } else {
      compiler[compilerFn]({/* watch options */}, webpackCompileDone);
    }
    return compiler;
  };

  /**
   * Compile function.
   *
   * - Cleans the /dist directory
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
    getWebpackConfigCurried: getWebpackConfigFn,
  };
};
