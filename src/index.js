'use strict'

const net = require('net')

const PORT = process.env.PORT || 8181
const server = net.createServer()

const logger = require('./helpers/logger.js').getLogger('index')

const parse = require('./protocol/parse.js')
const heart = require('./protocol/heart.js')
const handle = require('./lib/handle.js')

server.on('connection', function (socket) {
    server.getConnections((err, count) => {
        if (err) {
            return logger.error('读取连接数量出错:', err.message)
        }
        if (count) {
            // logger.debug('连接数量:', count)
        }
    })
    // 从连接中读取数据
    socket.on('data', async (buffer) => {
        logger.debug('接收的hex串:', buffer.toString('hex'))
        if (!Buffer.isBuffer(buffer)) return
        if (buffer.length < 32) return
        if (buffer.toString('hex', 0, 2) !== 'aa55') return

        let res
        try {
            let params = await parse(buffer)
            params = await heart(params)
            res = await handle(params)
            logger.debug('回复 hex串:', res.resBuffer.toString('hex'))
        } catch (err) {
            logger.error('出现错误!')
            logger.error(err.stack)
            logger.error(err.message)
            return
        }
        res && socket.write(res.resBuffer)
    })
    // 删除被关闭的连接
    socket.on('close', function (bool) {
        const log = bool ? '传输错误引起 socket 关闭' : 'socket 关闭连接'
        logger.debug(log)
    })
    socket.on('error', function (err) {
        logger.error('socket 报错:', err.message)
        logger.error('socket 报错:', err.stack)
        socket.destroy()
    })
})

server.on('error', function (err) {
    logger.error('tcp服务报错:', err.message)
    logger.error('tcp服务报错:', err.stack)
})

server.on('close', function () {
    logger.debug('tcp服务关闭')
})

server.listen(PORT, () => {
    const address = server.address()
    logger.info(`tcp server listening on ${address.port}`)
})

process.on('uncaughtException', function (err) {
    // 打印出错误
    logger.error('其他错误', err.message)
    // 打印出错误的调用栈方便调试
    logger.error(err.stack)
})
