'use strict'

/**
 * 解析心跳包
 */

const logger = require('../helpers/logger.js').getLogger('heart')
const hashFunc = require('../helpers/hashFunc.js')

const _ = require('lodash')
const redisCli = require('../helpers/redis.js')

// 设备的三种状态
let MachineType = {}
MachineType[MachineType['MachineTypeNormal'] = 1] = 'MachineTypeNormal'
MachineType[MachineType['MachineTypeDirect'] = 2] = 'MachineTypeDirect'
MachineType[MachineType['MachineTypeTurnover'] = 3] = 'MachineTypeTurnover'
MachineType[MachineType['MachineTypeClose'] = 4] = 'MachineTypeClose'

module.exports = async function heartHandler (params) {
    const { beginSign, deviceId, random, version, speed, wifi, mobileData, flag, frameType } = params

    logger.info('当前数据包类型: 心跳')

    let mType = MachineType.MachineTypeNormal
    logger.info(`设备id: ${deviceId}`)

    const stateStr = await redisCli.get(`${deviceId}_state`)
    if (stateStr) {
        let mState
        try {
            mState = JSON.parse(stateStr)
        } catch (e) {
            mState = null
        }
        if (!_.isEmpty(mState)) {
            if (mState.mode === 2 || mState.mode === 3) {
                mType = MachineType.MachineTypeDirect
            }
        }
        if (flag === 0) {
            mState.wifi = wifi
            mState.mobile = mobileData
        }
        if (flag === 1) {
            mState.wifi = wifi
            mState.mobile = mobileData
        }
        mState.flag = flag
        mState.speed = speed
        mState.version = buildVersionStr(version)
        await redisCli.set(`${deviceId}_state`, JSON.stringify(mState))
    }
    const logString = `模式: ${mType}, 版本: ${buildVersionStr(version)}, 转速: ${speed}`
    if (flag === 0) {
        logger.info(`信号方式: wifi; 信号强度: ${wifi}, ${logString}`)
    }
    if (flag === 1) {
        logger.info(`信号方式: gprs; 信号强度: ${mobileData}, ${logString}`)
    }

    const nowTime = ~~(Date.now() / 1000)

    let resBuffer = Buffer.alloc(32)
    resBuffer.writeUInt16LE(0x55AA, 0) // 头
    resBuffer.write(deviceId, 2, 16, 'ascii')// 机器id
    resBuffer.writeUInt32LE(random, 18)// 随机码
    logger.debug('当前时间:', nowTime)
    resBuffer.writeUInt32LE(nowTime, 22)// 当前时间

    let activitedTimeStr = await redisCli.get(`${deviceId}_activited`)
    let activitedTime = !activitedTimeStr ? 0 : Number(activitedTimeStr)

    let LastTimeStr = await redisCli.get(`${deviceId}_lastTick`)
    let LastTime = !LastTimeStr ? 0 : Number(LastTimeStr)
    await redisCli.set(`${deviceId}_lastTick`, nowTime.toString())

    // 判断当时设备是否在使用
    if (speed > 1) {
    // 判定上次是否在使用中
        if (await redisCli.exists(`${deviceId}_lastUse`)) {
            let useTime = nowTime - LastTime
            if (useTime <= 300) {
                await redisCli.incrby(`${deviceId}_useTime`, useTime)
            }
        }
        await redisCli.set(`${deviceId}_lastUse`, 1)
        await redisCli.expire(`${deviceId}_lastUse`, 300)
    } else {
        await redisCli.del(`${deviceId}_lastUse`)
    }
    const UP_TIME_KEY = `${deviceId}_upTime`
    let upTime = await redisCli.get(UP_TIME_KEY)
    if (!upTime) {
        await redisCli.set(UP_TIME_KEY, Date.now())
    } else {
        const onlineTime = Date.now() - Number(upTime)
        await redisCli.set(`${deviceId}_onlineTime`, onlineTime)
        await redisCli.expire(UP_TIME_KEY, 60)
    }

    let closeTime = mType === MachineType.MachineTypeDirect ? nowTime + 300 : activitedTime
    if (mType === 4) {
        closeTime = 0
    }
    logger.debug('关闭时间:', closeTime)
    resBuffer.writeUInt32LE(closeTime, 26)

    resBuffer.writeInt8(0x00, 30)// 保留位
    resBuffer.writeInt8(0x00, 31)// 帧类型

    // 加上校验
    resBuffer = hashFunc(resBuffer)
    logger.debug('\r\n')
    return {
        resBuffer,
        deviceId,
        frameType
    }
}

function buildVersionStr (version) {
    let versionStr = 'V'
    for (let i = 0; i < 4; i++) {
        versionStr += parseInt(version.substr(i * 2, 2))
        if (i !== 3) {
            versionStr += '.'
        }
    }
    return versionStr
}
