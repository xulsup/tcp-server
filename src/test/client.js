'use strict'

const net = require('net')

// const HOST = '47.106.193.158'
const HOST = '127.0.0.1'
const PORT = 8181
// const HOST = '116.62.89.79'
// const PORT = 10030

const buff1 = 'aa55363636303030303030303030303030315608bad801020302000000000000'
const buff2 = 'aa55363636303030303030303030303030318532bd2001020302000000000001e9a40100'
const buff3 = 'aa55363636303030303030303030303030318532bd2001020302000000000001bf0100e936363630303030303030303030303031004c465332313031445f56302e31000000005443500034372e3130362e3139332e3135380000383138310000303030000054502d4c494e4b5f35434539443000000000000000000000000000000000000000320030313233343536373839000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000434d4e455400000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

const buff4 = 'aa55363636303030303030303030303030311bb99b220102030200000000000131020100'

const buff5 = 'aa55363636303030303030303030303030318097822c010203020000000000012e0100e936363630303030303030303030303031004c465332313031445f56302e31000000005443500034372e31302e3139332e313538000038313831000033303030000054502d4c494e4b5f35434539443000000000000000000000000000000000000000320030313233343536373839000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000434d4e455400000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
const buff6 = 'aa5536363630303030303030303030303031d37c5f6001020302000000000001360100e9363636303030303030303030303031004c465332313031445f56302e31000000005443500034372e3130362e3139332e313538000038313831000033303030000054502d4c494e4b5f35434539443000000000000000000000000000000000000000320030313233343536373839000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000434d4e455400000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

function netf () {
    const client = net.createConnection({ port: PORT, host: HOST })

    client.write(Buffer.from(buff1, 'hex'))

    client.on('data', data => {
        console.log(data)
    // client.end()
    })

    client.on('end', () => {
        console.log('end')
    })
}

netf()