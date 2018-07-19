'use strict'

module.exports = async (raw) => {
    if (!Buffer.isBuffer(raw)) return
    if (raw.length < 32) return
    if (raw.toString('hex', 0, 2) !== 'aa55') return
    return raw
}
