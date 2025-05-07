const sessionManager = require('../utils/sessionManager');

// Generate Id Function:
function generateId() {
    return 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Generate Event Function:
async function addSession() {
    console.log('[i] Adding session...');

    await sessionManager.saveSession(generateId(), {
        date: new Date().toUTCString(),
        host: null,
        trainers: {},
        location: 'https://roblox.com',
        messageId: null,
        channelId: null
    });

    console.log('[✔︎] Complete!');
}

addSession().catch(console.error);