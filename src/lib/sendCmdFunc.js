'use strict'

const redisCli = require('../helpers/redis')
const key = 'FRAME_ID'
const logger = require('log4js').getLogger()

const configTem = require('../helpers/configTem.js')
// 经过这里之前 先改变原始包中的帧类型

async function buildFrameId () {
    const id = await redisCli.incr(key)
    let frameId = await redisCli.get(key)
    logger.log(typeof frameId)
    if (frameId >= 255) {
        let frameId = 0
        await redisCli.set(key, frameId)
    }
    return Number(frameId) - 1
}

// 0x00 复位终端命令
async function reset (resBuffer) {
    const resetBuffer = Buffer.alloc(3)
    const frameId = await buildFrameId()
    resetBuffer.writeUInt8(frameId, 0)
    resetBuffer.writeUInt8(0x00, 1)
    resetBuffer.writeUInt8(0, 2)
    return Buffer.concat([resBuffer, resetBuffer], resetBuffer.length + resBuffer.length)
}

// 0x01 读配置命令
async function readConfig (resBuffer) {
    const buffer = Buffer.alloc(3 + 6)
    const frameId = await buildFrameId()
    buffer.writeUInt8(frameId, 0)
    // 0x01
    buffer.writeUInt8(1, 1)
    // 数据域长度定为3
    buffer.writeInt16LE(3, 2)

    buffer.writeInt16LE(0, 3)
    buffer.writeInt16LE(230, 5)
    const prefix = resBuffer.slice(0, 32)
    return Buffer.concat([prefix, buffer], prefix.length + buffer.length)
}

// 0x02 写配置命令
async function writeConfig (resBuffer, params) {
    const frameId = await buildFrameId()

    const configBuffer = configTem.buildConfigBuffer(params, frameId)
    const prefix = resBuffer.slice(0, 32)

    await redisCli.set(`${params.deviceId}_logId`, params.logId)
    logger.info(`设置 ${params.deviceId}_logId`, params.logId)
    const res = Buffer.concat([prefix, configBuffer], prefix.length + configBuffer.length)
    return res
}

// 0x0A 读复位命令
async function readReset (resBuffer) {
    const buffer = Buffer.alloc(3)
    const frameId = await buildFrameId()
    buffer.writeUInt8(frameId, 0)
    buffer.writeUInt8(0x0A, 1)
    buffer.writeUInt8(0, 2)
    return Buffer.concat([resBuffer, buffer], resBuffer.length + buffer.length)
}

// 0x0B 清复位命令
async function clearReset (resBuffer) {
    const buffer = Buffer.alloc(3)
    const frameId = await buildFrameId()
    buffer.writeUInt8(frameId, 0)
    buffer.writeUInt8(0x0B, 1)
    buffer.writeUInt8(0, 2)
    return Buffer.concat([resBuffer, buffer], resBuffer.length + buffer.length)
}

// 0x09 读电压值
async function readVoltage (resBuffer) {
    const buffer = Buffer.alloc(3)
    const frameId = await buildFrameId()
    buffer.writeUInt8(frameId, 0)
    buffer.writeUInt8(0x09, 1)
    buffer.writeUInt8(0x00, 2)
    return Buffer.concat([resBuffer, buffer], resBuffer.length + buffer.length)
}

module.exports = {
    '0x00': reset,
    '0x01': readConfig,
    '0x02': writeConfig,
    '0x0A': readReset,
    '0x0B': clearReset,
    '0x09': readVoltage
}
