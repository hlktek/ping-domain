# ping-domain

1. edit index.js to update config
const hosts = ['domain1', 'domain2'];
const countFail = 3; // after 3 times ping fail -> notify tele
const teleReceiver = 'RECIEVER';
const teleBotToken = 'BOT_TOKEN';

2. npm install
3. node index.js
