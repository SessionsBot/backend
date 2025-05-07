const sessionManager = require('./sessionManager');

// Generate Id Function:
function generateId() {
    return 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function generateTimestamp(hourOfDay) {
    let eventDate = new Date();
    eventDate.setHours(hourOfDay || 7, 30, 0, 0);
    let eventDateTimestamp = Math.floor(eventDate.getTime() / 1000);
    return eventDateTimestamp;
}

// Generate Todays Training Sessions:
async function generateTodaysTrainingSessions() {
    console.log('[⚙️] Adding new sessions...');

    // 10:30 AM:
    await sessionManager.saveSession(generateId(), {
        type: 'Training',
        date: generateTimestamp(10),
        host: null,
        trainers: [],
        location: 'https://www.roblox.com/games/407106466/Munch-V1',
        messageId: null,
        channelId: null
    });

    // 2:30 PM:
    await sessionManager.saveSession(generateId(), {
        type: 'Training',
        date: generateTimestamp(14),
        host: null,
        trainers: [],
        location: 'https://www.roblox.com/games/407106466/Munch-V1',
        messageId: null,
        channelId: null
    });

    // 7:30 PM:
    await sessionManager.saveSession(generateId(), {
        type: 'Training',
        date: generateTimestamp(19),
        host: null,
        trainers: [],
        location: 'https://www.roblox.com/games/407106466/Munch-V1',
        messageId: null,
        channelId: null
    });


    // Debug:
    console.log('[✅] Complete!');
    const sessions = await sessionManager.readSessions();

    const debugAllSessions = true
    if (debugAllSessions) {
        console.log('[ i ] All sessions:');
        console.log(sessions);
    }


}

// Execute the function:
generateTodaysTrainingSessions().catch(console.error);