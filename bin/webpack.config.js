'use strict'
const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: {
    app: path.join(__dirname, '../index.js')
  },
  mode: 'production',
  target: 'node',
  output: {
    path: path.join(__dirname, '../tcp-server'),
    filename: 'index.js'
  },
  resolve: {
    extensions: ['.js']
  },

  context: __dirname,
  // 忽略打包 依赖
  externals: _externals(),
  node: {
    console: true,
    global: true,
    process: true,
    Buffer: true,
    __filename: false,
    __dirname: false,
    setImmediate: true
  },
  module: {
    rules: []
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          mangle: true,
          output: {
            comments: false,
            beautify: false
          },
          compress: {
            warnings: false,
            comparisons: false
          }
        }
      })
    ]
  }
}

function _externals () {
  let manifest = require(path.join(__dirname, '../package.json'))
  let dependencies = manifest.dependencies
  let externals = {}
  for (let p in dependencies) {
    externals[p] = 'commonjs ' + p
  }
  return externals
}
