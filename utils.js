const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const si = require('systeminformation');
const NetworkSpeed = require('network-speed');
const testNetworkSpeed = new NetworkSpeed();
const bytes = require('bytes');
const { Api } = require('telegram');

// Helper for bytes
function size_h(size) {
    return bytes(size) || '0B';
}

function time_h(seconds) {
    seconds = Math.floor(seconds);
    const hour = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    if (hour) return `${hour}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    if (minutes) return `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    return `${seconds.toString().padStart(2, '0')}s`;
}

async function ping(client, event) {
    console.log(event.message.message);
    const startTime = Date.now();
    const reply = await event.message.reply({ message: 'Pinging...' });
    const endTime = Date.now();
    await client.editMessage(event.chatId, { message: reply.id, text: `Pong! \n${endTime - startTime} ms` });
}

async function start(client, event) {
    console.log(event.message.message);
    await event.message.reply({ message: "Welcome to VersaT bot! You can use /help to see available commands." });
}

async function help(client, event) {
    console.log(event.message.message);
    const helpText = 
        "Here are the available commands:\n" +
        "- /start - Check bot alive status.\n" +
        "- /help - Get available commands.\n" +
        "- /ls - List directory.\n" +
        "- /download - or /dl to download files.\n" +
        "- /upload - or /up to upload files.\n" +
        "- /exec - or /e to execute shell commands.\n" +
        "- /speedtest - or /st to check internet speed.\n" +
        "- /ping - Check ping.";
    await event.message.reply({ message: helpText });
}

async function list_directory(client, event) {
    console.log(event.message.message);
    const parts = event.message.message.split(' ');
    let currentPath = process.cwd();
    if (parts.length > 1) {
        currentPath = path.join(currentPath, parts.slice(1).join(' '));
    }
    
    let filesStr = `Current Folder : \`${path.basename(currentPath) || currentPath}\`\n`;
    try {
        const listDir = fs.readdirSync(currentPath).sort();
        for (const item of listDir) {
            const itemPath = path.join(currentPath, item);
            if (fs.statSync(itemPath).isDirectory()) {
                filesStr += `\n📁 \`${item}\``;
            }
        }
        for (const item of listDir) {
            const itemPath = path.join(currentPath, item);
            if (!fs.statSync(itemPath).isDirectory()) {
                const size = size_h(fs.statSync(itemPath).size);
                filesStr += `\n\`${item}\` [${size}]`;
            }
        }
        await event.message.reply({ message: filesStr });
    } catch (err) {
        await event.message.reply({ message: err.toString() });
    }
}

async function execCmd(client, event) {
    console.log(event.message.message);
    const commandText = event.message.message.substring(event.message.message.indexOf(' ') + 1);
    if (!commandText || event.message.message.indexOf(' ') === -1) {
        await event.message.reply({ message: 'No commands to execute.' });
        return;
    }
    
    exec(commandText, async (error, stdout, stderr) => {
        const output = stdout || stderr || (error ? error.message : null) || "No Output";
        if (output.length > 4095) {
            fs.writeFileSync('output.txt', output);
            await client.sendFile(event.chatId, { file: 'output.txt', replyTo: event.message.id });
        } else {
            await event.message.reply({ message: output });
        }
    });
}

async function speedtest(client, event) {
    console.log(event.message.message);
    const msg = await event.message.reply({ message: 'Speed Test Started...' });
    try {
        const downloadUrl = 'https://eu.httpbin.org/stream-bytes/25000000';
        const downloadSize = 25000000;
        const dl = await testNetworkSpeed.checkDownloadSpeed(downloadUrl, downloadSize);
        
        const options = {
            hostname: 'www.google.com',
            port: 80,
            path: '/catchers/544b09b4599c1d0200000289',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        };
        const uploadSize = 2000000;
        const ul = await testNetworkSpeed.checkUploadSpeed(options, uploadSize);
        
        const text = `Internet Speed...\nDownload : ${dl.mbps} Mbps\nUpload : ${ul.mbps} Mbps`;
        
        await client.deleteMessages(event.chatId, [msg.id], { revoke: true });
        await event.message.reply({ message: text });
    } catch (err) {
        await client.editMessage(event.chatId, { message: msg.id, text: `Error: ${err.message}` });
    }
}

async function system_info(client, event) {
    const mem = await si.mem();
    const currentLoad = await si.currentLoad();
    const fsSize = await si.fsSize();
    const osInfo = await si.osInfo();
    const cpu = await si.cpu();
    const networkStats = await si.networkStats();
    
    const rootFs = fsSize[0] || { size: 0, used: 0, available: 0, use: 0 };
    const net = networkStats[0] || { tx_bytes: 0, rx_bytes: 0 };
    
    const text = 
        `Total Disk Space: ${size_h(rootFs.size)}\n` +
        `Used : ${size_h(rootFs.used)} | Free : ${size_h(rootFs.available)}\n\n` +
        `Resource Usage :\n` +
        `CPU : ${currentLoad.currentLoad.toFixed(2)}% | RAM : ${((mem.used / mem.total) * 100).toFixed(2)}% | Disk : ${rootFs.use}%\n\n` +
        `CPU Cores Count: \n` +
        `Physical : ${cpu.physicalCores} | Total : ${cpu.cores}\n\n` +
        `Total RAM : ${size_h(mem.total)}\n` +
        `Used : ${size_h(mem.used)} | Free : ${size_h(mem.free)}\n` +
        `Swap Memory : ${size_h(mem.swaptotal)} | Used : ${((mem.swapused / mem.swaptotal || 0) * 100).toFixed(2)}%\n\n` +
        `Network :\n` +
        `Upload : ${size_h(net.tx_bytes)} | Download : ${size_h(net.rx_bytes)}\n\n` +
        `OS Uptime : ${time_h(os.uptime())}`;
        
    await event.message.reply({ message: text });
}

async function forward(client, event) {
    console.log(event.message.message);
    const targetChat = 'tg_premium_today';
    let str = "";
    if (event.message.replyTo) {
        const repliedMessage = await event.message.getReplyMessage();
        str = repliedMessage.message;
    } else {
        str = event.message.message.substring(event.message.message.indexOf(' ') + 1);
    }
    const arr = str.split('\n');
    const links = arr.filter(i => i.startsWith('http'));
    
    for (const link of links) {
        const parts = link.split('/');
        const msgId = parseInt(parts[parts.length - 1]);
        const chatId = parts[parts.length - 2];
        try {
            await client.forwardMessages(targetChat, { messages: msgId, fromPeer: chatId });
        } catch (e) {
            console.log(e);
        }
    }
}

async function sendMessage(client, ids, eventStr) {
    for (const id of ids) {
        try {
            await client.sendMessage(id, { message: `Bot ${eventStr}ed!` });
        } catch(e) { console.log(e); }
    }
}

async function upload(client, event) {
    console.log(event.message.message);
    const args = event.message.message.split(' ');
    if (args.length < 2) {
        await event.message.reply({ message: 'Give file path to Upload.' });
        return;
    }
    const filePath = args.slice(1).join(' ');
    if (!fs.existsSync(filePath)) {
        await event.message.reply({ message: 'File not found.' });
        return;
    }
    const msg = await event.message.reply({ message: 'Uploading...' });
    try {
        await client.sendFile(event.chatId, {
            file: filePath,
            replyTo: event.message.id,
            progressCallback: (progress) => {
                // Not updating message per tick to avoid flood limits
                console.log(`Uploading ${filePath}: ${progress * 100}%`);
            }
        });
        await client.editMessage(event.chatId, { message: msg.id, text: `Upload Completed: ${path.basename(filePath)}` });
    } catch (err) {
        await client.editMessage(event.chatId, { message: msg.id, text: `Upload Failed: ${err.message}` });
    }
}

async function download_media(client, event) {
    console.log(event.message.message);
    const msg = await event.message.reply({ message: 'Downloading...' });
    if (event.message.replyTo) {
        const repliedMessage = await event.message.getReplyMessage();
        if (repliedMessage.media) {
            try {
                const buffer = await client.downloadMedia(repliedMessage, {
                    progressCallback: (progress) => {
                        console.log(`Downloading: ${progress * 100}%`);
                    }
                });
                
                const downloadsDir = path.join(process.cwd(), 'downloads');
                if (!fs.existsSync(downloadsDir)) {
                    fs.mkdirSync(downloadsDir);
                }
                
                let filename = `download_${Date.now()}`;
                if (repliedMessage.document?.attributes) {
                    const fileAttr = repliedMessage.document.attributes.find(a => a.className === 'DocumentAttributeFilename');
                    if (fileAttr) filename = fileAttr.fileName;
                }
                
                const savePath = path.join(downloadsDir, filename);
                fs.writeFileSync(savePath, buffer);
                
                await client.editMessage(event.chatId, { message: msg.id, text: `Downloaded successfully to:\n\`${savePath}\`` });
            } catch (err) {
                await client.editMessage(event.chatId, { message: msg.id, text: `Download Failed: ${err.message}` });
            }
        } else {
            await client.editMessage(event.chatId, { message: msg.id, text: 'Replied message has no media.' });
        }
    } else {
        await client.editMessage(event.chatId, { message: msg.id, text: 'Please reply to a media message to download.' });
    }
}

module.exports = {
    ping, start, help, list_directory, execCmd, speedtest, system_info, forward, size_h, time_h, sendMessage, upload, download_media
};
