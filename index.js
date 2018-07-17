'use strict'

const net = require('net')
const logger = require('./helpers/logger.js').getLogger('index')

const PORT = process.env.PORT || 3389
const server = net.createServer()
const _ = require('lodash')

// route
const heart = require('./protocol/heart.js')

const sockets = {}

server.on('connection', function (socket) {
  // 从连接中读取数据
  socket.on('data', async (buffer) => {
    logger.debug('接收的数据 hex:', buffer.toString('hex'))
    if (!Buffer.isBuffer(buffer)) return
    if (buffer.length < 32) return
    if (buffer.toString('hex', 0, 2) !== 'aa55') return
    const res = await heart(buffer)
    // 经历过心跳后 每个 socket都应该被存储
    sockets[res.machineId] = Object.assign(_.omit(res, ['resBuffer']), { socket })
    sockets[res.machineId].socket.write(res.resBuffer)
  })
  // 删除被关闭的连接
  socket.on('close', function () {
  })
})

server.on('error', function (err) {
  logger.error(err.message)
})

server.on('close', function () {
  logger.debug('server close')
})

server.listen(PORT, () => {
  const address = server.address()
  logger.debug(`tcp server listening on ${address.port}`)
  setInterval(() => {
    server.getConnections((err, count) => {
      if (err) {
        return logger.error(err.message)
      }
    })
  }, 2000)
})
