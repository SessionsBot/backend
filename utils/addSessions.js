const sessionManager = require('../sessionManager');

// Generate Id Function:
function generateId() {
    return 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function generateTimestamp() {
    let eventDate = new Date();
    let eventDateTimestamp = Math.floor(eventDate.getTime() / 1000);
    return eventDateTimestamp;
}

// Generate Event Function:
async function addSession() {
    console.log('[i] Adding session...');

    await sessionManager.saveSession(generateId(), {
        type: 'Training',
        date: generateTimestamp(),
        host: null,
        trainers: {},
        location: 'https://roblox.com',
        messageId: null,
        channelId: null
    });

    console.log('[✔︎] Complete!');
}

addSession().catch(console.error);