// Variables:
const {
    EmbedBuilder,  
    MessageFlags,
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle  
} = require('discord.js'); // Import Discord.js
const global = require('../../global.js') // Import Global Variables
const sessionManager = require('./sessionManager'); // Import Session Manager


// Clear Existing Sessions:
async function clearExistingSessions() {
    // Erase Session Database:
    if(global.outputDebug_General) {console.log('[⚙️] Clearing existing sessions...')}
        await sessionManager.writeSessions({});
    if(global.outputDebug_InDepth) {console.log('[✅] Complete!')}

    // Delete Previous Event Messages:
    const sessionAnnounceChannel = await global.client.channels.fetch(global.event_channelId);
    sessionAnnounceChannel.bulkDelete(100)
        .then(messages => {
            if(global.outputDebug_General) {console.log(`[⚙️] Deleted ${messages.size} messages from ${sessionAnnounceChannel.name}`)}
        })
        .catch(console.warn);
}

// Create New Sessions:
async function createEvents(times = [10, 14, 19]) {
    // Get announce channel:
    const sessionAnnounceChannel = await global.client.channels.fetch(global.event_channelId);
    // Debug:
    if(global.outputDebug_General) {console.log(`[⚙️] Adding today's sessions...`)}

    // Clear existing functions:
    await clearExistingSessions()
    // Wait 1s (for deletion to finish):
	await new Promise(resolve => setTimeout(resolve, 1000)); 

    // For each session time:
    for (const eventTimeHour of times) {
        // Generate Id:
        function generateId() {
            return 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        }
        // Generate Timestamp:
        function generateTimestamp(hourOfDay) {
            // Get current time in UTC
            const now = new Date();
        
            // Create tomorrow's date in CST/CDT using UTC offsets
            const dateUTC = new Date(now);
            // dateUTC.setUTCDate(now.getUTCDate() + 1); // Add 1 Day
            dateUTC.setUTCHours(0, 0, 0, 0); // Midnight UTC
        
            // Calculate current CST/CDT offset in hours
            const localTime = new Date();
            const chicagoTime = new Date(localTime.toLocaleString("en-US", { timeZone: "America/Chicago" }));
            const timezoneOffsetMs = localTime.getTime() - chicagoTime.getTime();
            const timezoneOffsetHours = timezoneOffsetMs / (1000 * 60 * 60);
        
            // Set desired time in UTC (CST/CDT + offset)
            dateUTC.setUTCHours(hourOfDay + timezoneOffsetHours, 30, 0, 0); // X:30 CST/CDT in UTC
        
            // Return timestamp:
            return Math.floor(dateUTC.getTime() / 1000);
        }
        // Save Session to Database:
        await sessionManager.saveSession(generateId(), {
            type: 'Training',
            date: generateTimestamp(eventTimeHour),
            host: null,
            trainers: [],
            location: 'https://www.roblox.com/games/407106466/Munch-V1',
            messageId: null,
            channelId: null
        });
    }

    // Get all sessions:
    const sessions = await sessionManager.readSessions();

    // Send sessions in announcement channel:
    for (const [sessionId, session] of Object.entries(sessions)) {
        // Send each event as embed msg:
        const sentMessage = await sessionAnnounceChannel.send(sessionManager.getEventEmbed(sessionId));

        // Update the session data with message/channel ids
        await sessionManager.saveSession(sessionId, {
            ...session, // keeps exisiting data
            messageId: sentMessage.id,
            channelId: sessionAnnounceChannel.id
        });
    }

    // Debug - Complete:
        if(global.outputDebug_General) {console.log('[✅] Complete!')}
}

// Start Session Creation Schedule:
async function startSchedule() {
    try {
        const cron = require('node-cron');
        const global = require('../../global.js')

        // Schedule the function to run every day at 10:15 AM CST
        cron.schedule('15 10 * * *', // MM HH (time to excecute)
            () => { // function to excecute
                createEvents();
            },
            { // schedule options
                scheduled: true,
                timezone: 'America/Chicago' // Ensures it's 10:15 AM CST/CDT
            }
        );

        // Call the function immediately when the bot starts up
        createEvents(10, 14, 19);

        // Debug
        if(global.outputDebug_General) {
            console.log('[⚙️] Session Scheduler Initiated!');
        }

    } catch (error) {
        // Error Occured:
        console.warn('[❗️] Session Scheduler Failed to Initialize:');
        console.log(error)
    }
}

// Export:
module.exports = {
    startSchedule
}