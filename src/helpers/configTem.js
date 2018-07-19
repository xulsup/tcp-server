'use strict'

const _ = require('lodash')

const logger = require('log4js').getLogger()
const tem = {
    deviceId: {
        len: 17,
        startAt: 0
    },
    hardwareInfo: {
        len: 17,
        startAt: 17
    },
    protocol: {
        len: 4,
        startAt: 34
    },
    ip: {
        len: 16,
        startAt: 38
    },
    remotePort: {
        len: 6,
        startAt: 54
    },
    localPort: {
        len: 6,
        startAt: 60
    },
    wifiName: {
        len: 33,
        startAt: 66
    },
    wifiType: {
        len: 2,
        startAt: 99
    },
    wifiPassword: {
        len: 64,
        startAt: 101
    },

    apn: {
        len: 65,
        startAt: 165
    }
}

const fields = ['deviceId', 'hardwareInfo', 'protocol', 'ip', 'remotePort', 'localPort', 'wifiName', 'wifiType', 'wifiPassword', 'apn']

const _default = require('../config.json')
function buildConfigBuffer (json, frameId) {
    if (process.env.SET_DEFAULT) {
        json = Object.assign({}, _default, json)
    } else {
        json = _.omit(json, ['cmdCode', 'deviceId'])
    }
    const targets = fields.reduce((res, val) => {
        if (json[val]) {
            res.push(val)
        }
        return res
    }, [])
    const current = {index: 0}
    const len = _.reduce(targets, (count, val) => {
        count += tem[val].len || 0
        return count
    }, 0)

    if (_.isEmpty(targets)) {
        logger.error('后台写配置有误!')
        return
    }

    logger.info('写配置长度', len)
    const buffer = Buffer.alloc(3 + 3)
    buffer.writeUInt8(frameId, 0)
    buffer.writeUInt8(0x02, 1)
    buffer.writeUInt8(len + 3, 2)
    buffer.writeInt16BE(tem[targets[0]].startAt, 3)
    buffer.writeUInt8(len, 5)

    const configBuffer = Buffer.alloc(len)
    targets.forEach(field => {
        const encode = field === 'wifiName' ? 'utf8' : 'ascii'
        const mark = tem[field]
        configBuffer.write((json[field] || '').trim(), current.index, mark.len, encode)
        current.index += mark.len
    })

    return Buffer.concat([buffer, configBuffer], buffer.length + configBuffer.length)
}

module.exports = {
    buildConfigBuffer
}
