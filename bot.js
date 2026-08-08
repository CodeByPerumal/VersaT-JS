const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const utils = require('./utils');

const apiId = config.apiId;
const apiHash = config.apiHash;
const botToken = config.botToken;
const adminIds = config.adminIds || [];

const stringSession = new StringSession(''); 

const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

async function main() {
    await client.start({
        botAuthToken: botToken,
    });
    console.log('You should now be connected.');
    
    console.log("Starting Bot...");
    await utils.sendMessage(client, adminIds, 'Start');

    client.addEventHandler(async (event) => {
        const text = event.message.message;
        console.log(text);
        if (!text || !text.startsWith('/')) return;
        
        const args = text.split(' ');
        const cmd = args[0].toLowerCase();
        
        if (cmd === '/start') {
            await utils.start(client, event);
        } else if (cmd === '/help') {
            await utils.help(client, event);
        } else if (cmd === '/ls') {
            await utils.list_directory(client, event);
        } else if (cmd === '/exec' || cmd === '/e') {
            await utils.execCmd(client, event);
        } else if (cmd === '/speedtest' || cmd === '/st') {
            await utils.speedtest(client, event);
        } else if (cmd === '/systeminfo' || cmd === '/sys') {
            await utils.system_info(client, event);
        } else if (cmd === '/forward' || cmd === '/f') {
            await utils.forward(client, event);
        } else if (cmd === '/ping' || cmd === '/p') {
            await utils.ping(client, event);
        } else if (cmd === '/upload' || cmd === '/up') {
            await utils.upload(client, event);
        } else if (cmd === '/download' || cmd === '/dl') {
            await utils.download_media(client, event);
        }
    }, new NewMessage({ incoming: true }));

    if (!fs.existsSync(path.join(__dirname, 'downloads'))) {
        fs.mkdirSync(path.join(__dirname, 'downloads'));
    }
}

main();
