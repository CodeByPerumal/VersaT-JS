require('dotenv').config();

module.exports = {
    apiId: parseInt(process.env.API_ID) || 23275262,
    apiHash: process.env.API_HASH || '13d854f2fa5a9ba3c03639fd67c522aa',
    botToken: process.env.BOT_TOKEN || '6897981040:AAFgEzcBoT2b1lqMd_b9ce3QepJE9XNQ2pc',
    splitSize: parseInt(process.env.SPLIT_SIZE) || 2097152000,
    adminIds: process.env.ADMIN_IDS 
        ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) 
        : [1118476751, -1001956807784]
};
