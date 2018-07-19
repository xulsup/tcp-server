'use strict'

const path = require('path')
const gulp = require('gulp')
const uglifyEs = require('gulp-uglify-es').default
// const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const gutil = require('gulp-util')

const fs = require('fs')

try {
  fs.statSync(path.join(__dirname, 'tcp-server'))
} catch (err) {
  fs.mkdirSync('./tcp-server')
}

gulp.task('default', function () {
  return gulp.src('src/**/*.js')
    // 这里可以启用 babel 转 es6 => es5
    // .pipe(babel({
  // presets: ["env","react"],
  // minified: true
    // }))
    .pipe(uglifyEs({
      // 类型：Boolean 默认：true 是否修改变量名
      mangle: true,
      // 类型：Boolean 默认：true 是否完全压缩
      compress: true
    }))
    .on('error', (err) => {
      gutil.log(gutil.colors.red('[Error]'), err.toString())
    })
    .pipe(gulp.dest('tcp-server'))
})

const packageJson = require('./package.json')
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

fs.writeFileSync('./tcp-server/package.json', JSON.stringify(json, null, 2))
