'use strict'

const only = require('only')
const logger = require('../helpers/logger.js').getLogger('parse')
const redisCli = require('../helpers/redis')

const channel = 'MACHINE_RELPY_INFO'

const handler = {
    // 终端回复 复位数据包
    '0x00': params => {
        logger.debug('收到终端回复 0x00')
        if (!params.operateResult) {
            logger.info('复位 操作成功!')
            redisCli.publish(channel, JSON.stringify(only(params, 'deviceId cmdCode operateResult logId onlineTime')))
        } else {
            redisCli.publish(channel, JSON.stringify(only(params, 'deviceId cmdCode operateResult logId onlineTime')))
            logger.error('复位 操作失败!')
        }
    },
    // 终端回复 服务端的读配置命令
    '0x01': async (params, rawBuffer) => {
        const configBuffer = rawBuffer.slice(36)

        let data = {
            deviceId: configBuffer.toString('ascii', 0, 17),
            hardwareInfo: configBuffer.toString('ascii', 17, 34),
            protocol: configBuffer.toString('ascii', 34, 38),
            ip: configBuffer.toString('ascii', 38, 54),
            remotePort: configBuffer.toString('ascii', 54, 60),
            localPort: configBuffer.toString('ascii', 60, 66),
            wifiName: configBuffer.toString('utf8', 66, 99),
            wifiType: configBuffer.toString('ascii', 99, 101),
            wifiPassword: configBuffer.toString('ascii', 101, 165),
            apn: configBuffer.toString('ascii', 165, 230),
            cmdCode: '0x01',
            logId: params.logId,
            onlineTime: params.onlineTime
        }
        logger.info('0x01 解回复数据', JSON.stringify(data))
        redisCli.publish(channel, JSON.stringify(data))
        return { ...params, ...data }
    },
    // 写配置命令
    '0x02': params => {
        redisCli.publish(channel, JSON.stringify(only(params, 'deviceId cmdCode operateResult logId onlineTime')))
        if (!params.operateResult) {
            logger.info('改配置成功!')
        }
        if (params.operateResult === 1) {
            logger.error('改配置失败!')
        }
        return params
    },
    // 读复位值命令
    '0x0A': (params, rawBuffer) => {
        let data = {}
        if (params.operateResult === 0) {
            data = {
                code: rawBuffer.readUInt8(37),
                msg: ''
            }
        }
        redisCli.publish(channel, JSON.stringify({
            ...only(params, 'deviceId cmdCode operateResult logId'),
            data
        }))
    },
    // 清除复位命令
    '0x0B': params => {
        redisCli.publish(channel, JSON.stringify(only(params, 'deviceId cmdCode operateResult logId')))
    },
    // 读到的电压值
    '0x09': (params, rawBuffer) => {
        const data = {
            voltage: rawBuffer.readUInt16BE(36)
        }
        redisCli.publish(channel, JSON.stringify({
            ...only(params, 'deviceId cmdCode operateResult logId'),
            data
        }))
    }
}

module.exports = async function (rawBuffer) {
    const params = {
        // 头
        beginSign: rawBuffer.toString('hex', 0, 2),
        // 设备id
        deviceId: rawBuffer.toString('ascii', 2, 18),
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
    if (rawBuffer.length >= 32 && params.frameType === 1) {
        const logId = await redisCli.get(`${params.deviceId}_logId`)
        const onlineTime = await redisCli.get(`${params.deviceId}_onlineTime`)

        Object.assign(params, {
        // 帧号
            frameNum: rawBuffer.readUInt8(32),
            // cmd
            cmdCode: '0x' + rawBuffer.toString('hex', 33, 34).toUpperCase(),
            // status 接收状态
            operateResult: rawBuffer.readUInt8(34),
            payloadLen: rawBuffer.readUInt8(35),
            logId,
            onlineTime
        })
        logger.debug('终端回复数据', JSON.stringify(params))
    }

    return handler[params.cmdCode] ? handler[params.cmdCode](params, rawBuffer) : params
}
