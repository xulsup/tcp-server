'use strict'

const redisCli = require('../helpers/redis')

module.exports = function (deviceId) {
    const key = `CMD_${deviceId}`
    return redisCli.get(key)
}
