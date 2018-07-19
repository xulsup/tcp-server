'use strict'

/**
 * 解析心跳包
 */

const logger = require('../helpers/logger.js').getLogger('heart')
const hashFunc = require('../helpers/hashFunc.js')

const redisCli = require('../helpers/redis.js')
const _ = require('lodash')
// 设备的三种状态
let MachineType = {}
MachineType[MachineType['MachineTypeNormal'] = 1] = 'MachineTypeNormal'
MachineType[MachineType['MachineTypeDirect'] = 2] = 'MachineTypeDirect'
MachineType[MachineType['MachineTypeTurnover'] = 3] = 'MachineTypeTurnover'
MachineType[MachineType['MachineTypeClose'] = 4] = 'MachineTypeClose'

module.exports = async function heartHandler (params) {
    const { beginSign, machineId, random, version, speed, wifi, mobileData, flag, frameType } = params

    logger.debug('当前数据包类型: 心跳')

    let mType = MachineType.MachineTypeNormal
    logger.debug(`设备id: ${machineId}`)

    const stateStr = await redisCli.get(`${machineId}_state`)
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
        await redisCli.set(`${machineId}_state`, JSON.stringify(mState))
    }
    const logString = `模式: ${mType}, 版本: ${buildVersionStr(version)}, 转速: ${speed}`
    if (flag === 0) {
        logger.debug(`信号方式: wifi; 信号强度: ${wifi}, ${logString}`)
    }
    if (flag === 1) {
        logger.debug(`信号方式: gprs; 信号强度: ${mobileData}, ${logString}`)
    }

    const nowTime = ~~(Date.now() / 1000)

    let resBuffer = Buffer.alloc(32)
    resBuffer.writeUInt16LE(0x55AA, 0) // 头
    resBuffer.write(machineId, 2, 16, 'ascii')// 机器id
    resBuffer.writeUInt32LE(random, 18)// 随机码
    logger.debug('当前时间:', nowTime)
    resBuffer.writeUInt32LE(nowTime, 22)// 当前时间

    let activitedTimeStr = await redisCli.get(`${machineId}_activited`)
    let activitedTime = !activitedTimeStr ? 0 : Number(activitedTimeStr)

    let LastTimeStr = await redisCli.get(`${machineId}_lastTick`)
    let LastTime = !LastTimeStr ? 0 : Number(LastTimeStr)
    await redisCli.set(`${machineId}_lastTick`, nowTime.toString())

    // 判断当时设备是否在使用
    if (speed > 1) {
    // 判定上次是否在使用中
        if (await redisCli.exists(`${machineId}_lastUse`)) {
            let useTime = nowTime - LastTime
            if (useTime <= 300) {
                await redisCli.incrby(`${machineId}_useTime`, useTime)
            }
        }
        await redisCli.set(`${machineId}_lastUse`, 1)
        await redisCli.expire(`${machineId}_lastUse`, 300)
    } else {
        await redisCli.del(`${machineId}_lastUse`)
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
    logger.debug('回复心跳 hex串:', resBuffer.toString('hex'))
    logger.debug('\r\n')
    return {
        resBuffer,
        machineId,
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
