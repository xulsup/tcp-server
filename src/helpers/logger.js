'use strict'

const log4js = require('log4js')

let LEVEL = process.env.NODE_ENV === 'production' ? 'INFO' : 'ALL'

const config = {
    replaceConsole: true,
    appenders: {
        stdout: {
            type: 'stdout'
        },
        dateFile: {
            type: 'dateFile',
            filename: 'log/req.',
            encoding: 'utf-8',
            pattern: 'yyyy-MM-dd.log',
            mode: 0o0660,
            flags: 'a+',
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ['stdout', 'dateFile'], level: LEVEL }
    }
}

log4js.configure(config)

module.exports = log4js
