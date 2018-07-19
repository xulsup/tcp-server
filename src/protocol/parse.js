'use strict'

// const logger = require('../helpers/logger.js').getLogger('parse')

module.exports = async function (rawBuffer) {
    const params = {
        // 头
        beginSign: rawBuffer.toString('hex', 0, 2),
        // 设备id
        machineId: rawBuffer.toString('ascii', 2, 18),
        // 随机值
        random: rawBuffer.readUInt32LE(18),
        // 固定版本
        version: rawBuffer.toString('hex', 22, 26),
        // 风机转速
        speed: rawBuffer.readUInt16LE(26),
        // wifi强度
        wifi: rawBuffer.readUInt8(28),
        // 移动数据强度
        mobileData: rawBuffer.readUInt8(29),
        // 发送标志 0-wifi 1-移动数据
        flag: rawBuffer.readUInt8(30),
        // 帧类型 0-心跳 1-命令
        frameType: rawBuffer.readUInt8(31)
    }
    // 命令帧
    if (rawBuffer.length > 32) {
        Object.assign(params, {

        })
    }
    return params
}
