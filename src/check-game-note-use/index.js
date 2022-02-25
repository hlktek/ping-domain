const teleReceiver = 'RECIEVER';
const teleBotToken = 'BOT_TOKEN';

const API_GATEWAY_URL = 'http://localhost:3000/v2';

const { default: axios } = require('axios');

const TCPPortCheck = require('./tcp-port-check')

const portChecker = new TCPPortCheck({
    timeout: 500,
    getBanner: 512
})

/**
 * 
 * @returns [{"serviceId":"1988","version":"1","serverInfo":{"serviceName":"MIB","serverId":"v1.1","host":"159.65.6.242:31202","category":"fish","protoFile":"fish-service.proto","protoService":"MaintainService","maintainGroupable":true,"proxyServiceId":"","isActive":true,"lastAction":1645347158590},"eventMapping":{},"configType":"share"}]
 */
async function getServiceInfo() {
    let serviceInfos = [];
    try {
        const responseServiceInfo = await axios({
            url : `${API_GATEWAY_URL}/api-system/servers`,
            method : 'get',
            params : {
                serviceId : 'all'
            }
        })
        if (responseServiceInfo.status === 200) {
            serviceInfos = responseServiceInfo.data;
        }
    } catch (err) {
        console.error(err);
    }
    return serviceInfos;
}

async function getServiceNotUse(overtime = 3 * 24 * 60 * 60 * 1000) { // default 3days.
    const serviceInfos = await getServiceInfo();
    const now = Date.now();
    return serviceInfos.filter((serviceInfo) => {
        return !['platform', 'fish'].includes(serviceInfo.serverInfo.category) && serviceInfo.serverInfo.lastAction < now - overtime;
    })
}

async function run() {
    const listServiceInfos = await getServiceNotUse();
    const listServiceNotUsed = [];
    // console.log(listServiceInfos);
    for (const serviceInfo of listServiceInfos) {
        const host = serviceInfo.serverInfo.host;
        if (host && !host.startsWith('http') && host.includes(':')) {
            const ip = host.split(':')[0];
            const port = host.split(':')[1];
            const resultCheck = await portChecker.check(ip, port);
            console.log(host, 'is open', resultCheck.opened);
            if (resultCheck.opened) {
                listServiceNotUsed.push(serviceInfo);
            }
        }
    }

    const messageTele = listServiceNotUsed.map((serviceInfo) => {
        const host = serviceInfo.serverInfo.host;
        const ip = host.split(':')[0];
        return`${serviceInfo.serviceId} - ${serviceInfo.version} - ${serviceInfo.serverInfo.serverId} - ${LIST_SERVER[ip]}`; 
    }).join('\n');

    console.log(messageTele);
    if (messageTele) {
        axios({
            url : `https://api.telegram.org/${teleBotToken}/sendmessage?chat_id=${teleReceiver}&text=${messageTele}`,
        })
    }
}

setInterval( async () => {
    run();
}, 300000);

run();

const LIST_SERVER = {
    "localhost": "my server",
};
