/**
 * webpack-dev-server module.
 *
 * Starts the dev-server at localhost:8080.
 *
 */

const portfinder = require('portfinder');
const WebPackDevServer = require('webpack-dev-server');
const logger = require('./logger');
/**
 * Run the webpack-dev-server.
 * @param compiler Instance of webpack MultiCompiler.
 * @param webpackDevServer
 * @returns {Server}
 */
const runDevServer = (webpackDevServer, compiler) => {

  const WDS = webpackDevServer || WebPackDevServer;

  const port = 8080;
  const projectPath = process.cwd();
  const devServerOverrides = Array.isArray(compiler.compilers) && compiler.compilers[0].options
    ? compiler.compilers[0].options.devServer
    : null;

  const localOpts = {
    port,
    stats: {
      colors: true,
      detailed: true,
    },
    contentBase: projectPath,
    publicPath: '/dist/',
    compress: true,
    clientLogLevel: 'info',

    // These options *should* open a new browser but apparently aren't supported
    // in the node api.
    open: true,
    openPage: '',
  };
  const merged = {
    ...localOpts,
    ...devServerOverrides,
  };
  const server = new WDS(compiler, {
    ...merged,
  });
  portfinder.basePort = port;
  portfinder.getPortPromise()
    .then(finalPort => (
      server.listen(finalPort, '127.0.0.1', () => {
        logger.info(`Starting server on http://localhost:${finalPort}`);
      })
    ))
    .catch(err => logger.info(`could not get a free port due to error: ${err}`));
  return server;
};

module.exports = runDevServer;
