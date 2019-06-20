const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');
const nodeExternals = require('webpack-node-externals')

module.exports = {

  output: {
    libraryTarget: 'commonjs2',
  },
  target: 'node',

  externals: nodeExternals({
    whitelist: [/@rei/,'vue'],
  }),

  plugins: [
    new VueSSRServerPlugin(),
  ],

};
