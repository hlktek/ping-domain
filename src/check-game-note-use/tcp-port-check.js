const net = require('net')
const EventEmitter = require('events').EventEmitter

class PortCheck extends EventEmitter{
    constructor(option) {
        super()
        this.timeout = option.timeout || 3000
        this.getBanner = option.getBanner == null ? false : (parseInt(option.getBanner) || 512)
    }

    check(ip, port) {
        return new Promise((resolve) => {
            let result = {};
            let startConnectTime = Date.now();
            let socket = net
                .createConnection(port, ip)
                .removeAllListeners('timeout')
                .setTimeout(this.timeout);
            socket
                .once('close', ()=>{
                    this.emit('done', ip, port, result);
                    resolve(result);
                })
                .on('error', err => {
                    switch (err.errno){
                        case 'ECONNREFUSED':
                            result = {
                                status: 'refused',
                                opened: false
                            }
                            break;
                        case 'EHOSTUNREACH':
                        case 'ENETUNREACH':
                        case 'ENOPROTOOPT':
                            result = {
                                status: 'unreachable',
                                opened: false
                            }
                            break;
                        case 'ECONNRESET':
                            result = {
                                status: 'reset',
                                opened: false
                            }
                            break;
                        default :
                            console.log('Unknown error: ', err)
                            result = {
                                status: 'unknown',
                                message: err.errno || err.message || err,
                                opened: false
                            }
                            break;
                    }
                })
                .once('connect', () => {
                    result.connectTime = Date.now() - startConnectTime;
                    result.opened = true;
                    if (! this.getBanner) {
                        PortCheck.socketDestroy(socket);
                    }
                })
                .on('timeout', () => {
                    if (! result.opened) {
                        result = {
                            status: 'timeout',
                            opened: false
                        }
                    }
                    else {
                        result.status = 'open'
                    }
                    PortCheck.socketDestroy(socket)
                })
                .on('data', chunk => {
                    if (! this.getBanner) {
                        PortCheck.socketDestroy(socket);
                        return
                    }
                    let data = chunk.toString().split('\0').shift()
                    if (data) {
                        result.banner = data
                            .replace(/[\r\n]/g, ' ')
                            .trim()
                            .substring(0, this.getBanner)
                    }
                })
        });
    }

    static socketDestroy(socket) {
        socket.destroySoon();
    }
}

module.exports = PortCheck