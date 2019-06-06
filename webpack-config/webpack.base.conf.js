const path = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const autoprefixer = require('autoprefixer');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const cssnano = require('cssnano');

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

const miniCSSExtract = new MiniCssExtractPlugin({
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
        include: () => (process.env.febs_test ? path.join(projectPath, 'test', 'fixtures') : [path.join(projectPath, 'src'), /node_modules\/@rei/]),
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  // core-js polyfills
                  "useBuiltIns": "usage",
                  "corejs": 3,

                  // browserslist
                  "targets": {
                    "browsers": [
                        "Chrome >= 70",
                        "Firefox > 64",
                        "iOS > 11",
                        "Safari >= 9",
                        "Explorer >= 11",
                        "Edge >= 15"
                    ]
                  }
                }]
            ],
            cacheDirectory: path.resolve('./node_modules/.babelcache'),
          },
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        include: () => (process.env.febs_test ? path.join(projectPath, 'test', 'fixtures') : [path.join(projectPath, 'src'), /node_modules\/@rei/]),
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                cssnano(),
                autoprefixer(),
              ],
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                cssnano(),
                autoprefixer(),
              ],
            },
          },
          'less-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                cssnano(),
                autoprefixer(),
              ],
            },
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

    new VueLoaderPlugin(),

    miniCSSExtract,

    new UglifyJsPlugin({
      sourceMap: env === 'prod',
      uglifyOptions: {
        mangle: {
          safari10: true, // See https://github.com/webpack-contrib/uglifyjs-webpack-plugin/issues/92
        },
        compress: env === 'prod',
      },
    }),


    new ManifestPlugin({
      fileName: 'febs-manifest.json',
      publicPath: '', // dont include the public path in the key value of the manifest file
    }),

  ],
};
