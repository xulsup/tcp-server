'use strict'

const fs = require('fs')
const path = require('path')

const packageJson = require('../package.json')
const webpack = require('webpack')
const config = require('./webpack.config')

const json = {
  'name': 'tcp-server',
  'version': '1.0.0',
  'description': '',
  'main': 'index.js',
  'scripts': {
  },
  'author': '',
  'dependencies': packageJson.dependencies
}

function build () {
  const compiler = webpack(config)
  return new Promise((resolve, reject) => {
    console.log('start build...')
    compiler.run((err, stats) => {
      if (err) {
        console.log(err.message)
        console.log(err.stack)
        reject(err)
      }
      const messages = stats.toJson({}, true)
      if (messages.errors.length > 0) {
        reject(messages.errors.join('\r\n'))
      }
      resolve()
    })
  })
    .then(() => {
      fs.writeFileSync(path.join(__dirname, '../tcp-server/package.json'), JSON.stringify(json, null, 2))
      console.log('build end...')
    })
}

build()
