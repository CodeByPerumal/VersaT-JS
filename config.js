require('dotenv').config();

module.exports = {
    apiId: parseInt(process.env.API_ID),
    apiHash: process.env.API_HASH,
    botToken: process.env.BOT_TOKEN,
    splitSize: parseInt(process.env.SPLIT_SIZE),
    adminIds: process.env.ADMIN_IDS 
        ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) 
        : [1118476751, -1001956807784]
};