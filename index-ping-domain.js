const hosts = ['domain1', 'domain2'];
const countFail = 3; // after 3 times ping fail -> notify tele
const teleReceiver = 'RECIEVER';
const teleBotToken = 'BOT_TOKEN';

const { default: axios } = require('axios');
const ping = require('ping');

const hostStatus = {};

hosts.forEach( host => {
    hostStatus[host] = 0;
})

async function run() {
    for(let host of hosts){
        let res = await ping.promise.probe(host, {
            min_reply: 10
        });
        if (res.alive) {
            console.log('Host:', host, 'status: ', res.alive);
            hostStatus[host] = 0;
        } else {
            hostStatus[host]++;
            console.log(res);
        }
    }

    const warningHosts = hosts.filter( host => {
        return hostStatus[host] >= countFail;
    })

    if (warningHosts.length > 0) {
        axios({
            url : `https://api.telegram.org/${teleBotToken}/sendmessage?chat_id=${teleReceiver}&text=Please check hosts: ${warningHosts.join(', ')}`,
        })
    }
}

setInterval( async () => {
    run();
}, 10000);

run();