/**
 * webpack-dev-server module.
 *
 * Starts the dev-server at localhost:8080.
 *
 */

const logger = require('./logger');
const WebPackDevServer = require('webpack-dev-server');
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
  const devServerOverrides = compiler.compilers[0].options ? compiler.compilers[0].options.devServer : null;

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

  server.listen(port, '127.0.0.1', () => {
    logger.info(`Starting server on http://localhost:${port}`);
  });
  return server;
};

module.exports = runDevServer;
