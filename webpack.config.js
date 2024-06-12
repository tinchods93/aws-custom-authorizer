const slsw = require('serverless-webpack');
const path = require('path');

module.exports = {
  target: 'node',
  externalsPresets: { node: true },
  entry: slsw.lib.entries,
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
    },
  },
  devtool: slsw.lib.webpack.isLocal
    ? 'source-map'
    : 'inline-cheap-module-source-map',
  externals: [
    { 'aws-sdk': 'commonjs aws-sdk' },
    { 'aws-crt': 'commonjs aws-crt' },
  ],
  resolve: {
    extensions: ['.js', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: 'ts-loader',
        exclude: [
          [
            path.resolve(__dirname, '.serverless'),
            path.resolve(__dirname, '.webpack'),
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, 'test'),
          ],
        ],
      },
      {
        test: /\.test\.(js|ts)$/,
        loader: 'ignore-loader',
      },
    ],
  },
};
