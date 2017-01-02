var path = require('path');
var TimestampWebpackPlugin = require('timestamp-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, 'src/main.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules\/(?!react-router).*/, loader: 'babel-loader?experimental&optional=runtime'},
      {test: /\.css$/, loader: 'style-loader!css-loader'},
      {test: /\.(png|jpg|svg)$/, loader: 'url-loader?limit=8192'},
      {test: /\.scss$/, loader: "style!css!sass"}
    ]
  },
  node: {
    fs: 'empty'
  },
  plugins: [
    new TimestampWebpackPlugin({
      path: path.resolve(__dirname, 'dist'),
      filename: 'build-timestamp.json'
    })
  ]
};