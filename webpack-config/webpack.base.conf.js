const path = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const autoprefixer = require('autoprefixer');
const postCSSImport = require('postcss-import');

// Client project path.
const projectPath = process.cwd();
const projectPackageJson = path.join(projectPath, 'package.json');

if (!fs.existsSync(projectPackageJson)) {
  throw new Error(`
  No package.json found. Things to check:
      - Be sure you are building from project root directory.
      - Be sure your package.json has a name property.
      `);
}

const packageName = fs.readJsonSync(projectPackageJson).name;

if (!packageName || packageName.length === 0) {
  throw new Error('Be sure your package.json has a name property.');
}

// Get appropriate environment.
const env = !process.env.NODE_ENV ? 'prod' : process.env.NODE_ENV;

const extractSass = new MiniCssExtractPlugin({
  filename: env === 'dev' ? '[name].bundle.css' : '[name].bundle-[contenthash].css',
});

module.exports = {

  entry: {
    app: [
      path.resolve(projectPath, 'src/js/entry.js'),
      path.resolve(projectPath, 'src/style/entry.less'),
    ],
  },

  output: {
    path: path.resolve(projectPath, 'dist', packageName),
    filename: env === 'prod' ? '[name].bundle-[hash].js' : '[name].bundle.js',
    publicPath: '/dist/',
  },

  mode: env === 'prod' ? 'production' : 'development',

  target: 'web',

  resolve: {
    extensions: [
      '.js',
      '.json',
      '.vue',
      '.scss',
      '.css',
    ],
  },

  devtool: env === 'dev'
    ? 'eval-source-map' /* internal, cheap, fast */
    : 'source-map' /* external */,

  // Resolve loaders relative to rei-febs (as this will be a dependency of another module.)
  resolveLoader: {
    modules: [
      path.resolve(__dirname, '..', 'node_modules'),
      path.resolve(projectPath, 'node_modules'),
    ],
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // Ignore client's .babelrc and use the .babelrc in @rei/febs.
            babelrcRoots: [path.join(__dirname, '..')],
            cacheDirectory: path.resolve('./.babelcache'),
          },
        },
      },
      {
        test: /\.vue$/,
        exclude: /node_modules/,
        loader: 'vue-loader',
      }, {
        test: /\.(s[ac]|c)ss$/,
        use: [
          env !== 'prod' ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: loader => [
                postCSSImport({ root: loader.resourcePath }),
                autoprefixer(),
              ],
            },
          }, {
            loader: 'sass-loader',
            options: {
              outputStyle: env === 'prod' ? 'compressed' : 'nested',
            },

          },
          'sass-loader',
        ],
      }, {
        test: /\.less$/,
        use: [
          env !== 'prod' ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              minimize: env === 'prod',
              sourceMap: env !== 'prod',
            },
          }, {
            loader: 'postcss-loader',
            options: {
              plugins: loader => [
                postCSSImport({ root: loader.resourcePath }),
                autoprefixer(),
              ],
            },
          }, {
            loader: 'less-loader',
            options: {},
          },
        ],
      },
      {
        test: /\.svg$/,
        loader: 'file-loader',
        options: {
          emitFile: false,
        },
      },
    ],
  },

  plugins: [

    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: env === 'prod' ? '"production"' : '""',
      },
    }),

    extractSass,

    new MiniCssExtractPlugin({
      filename: env === 'dev' ? '[name].bundle.css' : '[name].bundle-[contenthash].css',
    }),

    new ManifestPlugin({
      fileName: 'febs-manifest.json',
      publicPath: '',
    }),

    new UglifyJsPlugin({
      sourceMap: env === 'prod',
      uglifyOptions: {
        mangle: {
          safari10: true, // See https://github.com/webpack-contrib/uglifyjs-webpack-plugin/issues/92
        },
        compress: env === 'prod',
      },
    }),
  ],
};
