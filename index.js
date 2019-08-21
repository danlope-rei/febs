/* eslint-disable global-require, import/no-dynamic-require, no-nested-ternary */

const wp = require('webpack');
const R = require('ramda');
const path = require('path');
const merge = require('webpack-merge');
const fsExtra = require('fs-extra');
const { baseConfigFn, ssrConfig } = require('@rei/front-end-build-configs').profiles.application;
const logger = require('./lib/logger');
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

  logger.info(`✅ Current node version: ${process.version}.`);

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
  const readJson = filePath => fsExtra.readJsonSync(filePath);
  const getFebsConfigJson = readJson.bind(null, febsConfigPath);

  const getFebsConfig = memoize((febsConfig = {}) => {
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

    return R.mergeRight(febsConfig, febsConfigFileJSON);
  });

  /**
   * Determine if we are building SSR bundle.
   * Note: In dev mode, we disable SSR as it is expensive (time and size) and
   * slows down live-reloading.
   * @param {String} buildEnv ("production" || "development")
   * @param {Object} febsConfig
   * @returns {boolean}
   */
  const isSSR = (buildEnv, febsConfig) => buildEnv !== 'development' && febsConfig.ssr;

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

      return R.mergeRight(R.dissoc('entry', wpConfNewOutputPath), {
        entry: newEntries,
      });
    }

    return wpConfNewOutputPath;
  };

  /**
   * Merge the SSR webpack config with the base config and return
   * array of the client and server-side webpack configs.
   *
   * @param ssr Whether or not to create the server-side bundle.
   * @param {Array} wpConf. The base wp conf wrapped in array.
   * @returns {Array} An array containing CS and SS bundles.
   */
  const addVueSSRConfigToConfigList = R.curry((ssr, wpConf) => {
    if (!ssr) {
      return wpConf;
    }

    const pluginsToRemove = ['ManifestPlugin'];

    // Remove above plugins during SSR build.
    const plugins = wpConf[0].plugins
      .filter(plugin => !pluginsToRemove.includes(plugin.constructor.name));

    const pluginsFiltered = R.mergeRight(R.dissoc('plugins', wpConf[0]), {
      plugins,
    });

    // Add SSR config.
    const ssrBuildConfig = merge.smartStrategy({
      entry: 'replace',
      plugins: 'append',
    })(pluginsFiltered, ssrConfig);

    // Add the SSR build config to the array of wp configs to build.
    return wpConf.concat(ssrBuildConfig);
  });

  /**
   * Get the webpack config using:
   *  - webpack.base.conf.js
   *  - confOverrides
   *  - febs-config.json
   *
   * @param confOverride Optional conf overrides that comes in either from
   * webpack.overrides.conf or from unit tests.
   *
   * @returns {Array}. The base config wrapped in an array.
   *                    (webpack consumes array of build configs.)
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
    return [febsConfigMerge(getFebsConfig(), wpConf)];
  });

  /**
   * Get the webpack config. This depends upon:
   *  - the base webpack config.
   *  - the webpack server config for optional SSR (ssr property in febs-config)
   *  - any other overrides coming in from febs-config.json.
   *  - optional overrides passed in from unit tests.
   */
  const getWebpackConfigsFn = ssr => R.compose(
    addVueSSRConfigToConfigList(ssr),
    getWebpackConfigBase
  );

  /**
   * Configure
   * @param ssr Whether or not to include SSR webpack build config.
   * @returns {function} A function that takes overrides argument
   * and returns final webpack configs (both client and server).
   */
  const getWebpackConfigs = ssr => getWebpackConfigsFn(ssr);

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
    getWebpackConfigs(ssr)
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
    if (!stats.hasErrors()) {
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

    Object.keys(compiler.compilers[0].options.entry).forEach(e => logger.info(`   ✔ ${e}`));

    logger.info(`📝 Writing assets to ${path.relative(projectPath, compiler.outputPath)}...`);

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
  const cleanDestDir = fsExtra.emptyDirSync.bind(null, getWebpackConfigBase()[0].output.path);

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
    runCompile(isSSR(env, getFebsConfig()));
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
    getWebpackConfig: getWebpackConfigs,
    addVueSSRToWebpackConfig: addVueSSRConfigToConfigList,
    getWebpackConfigFn: getWebpackConfigsFn,
    febsConfigMerge,
    isSSR,
  };
};
