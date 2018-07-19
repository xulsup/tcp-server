'use strict'

const Redis = require('ioredis')

const redisCli = new Redis({
    port: 6379,
    host: '127.0.0.1',
    family: 4,
    password: '',
    db: 0
})

const str = JSON.stringify({
    'deviceId': '6660000000000001',
    // 'hardwareInfo': 'LFS2101D_V0.1',
    // 'protocol': 'TCP',
    // 'ip': '47.106.193.158',
    // 'remotePort': '8181',
    // 'localPort': '3000',
    'wifiName': '缘客来9-10-11',
    'wifiType': '2',
    'wifiPassword': '0123456789',
    // 'apn': 'CMNET',
    'cmdCode': '0x02'
})
redisCli.set('CMD_6660000000000001', str)

// redisCli.set('CMD_6660000000000001', JSON.stringify({
//     'deviceId': '6660000000000001',
//     'cmdCode': '0x01'
// }))
