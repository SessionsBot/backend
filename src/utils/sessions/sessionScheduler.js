// Variables:
const {
    EmbedBuilder,  
    MessageFlags,
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,  
    ChannelType,
    time
} = require('discord.js'); // Import Discord.js
const global = require('../global.js') // Import Global Variables
const sessionManager = require('./sessionManager.js');
const { db, createNewGuild } = require('../firebase.js'); // Import Firebase


// Create New Sessions:
async function createEvents(guildId, times = [10, 14, 19]) {
    // Get Guild Data:
    let guildDoc = await db.collection('guilds').doc(String(guildId)).get();
    if (!guildDoc.exists) { // Confirm Guild:
        console.log(`Guild with ID ${guildId} does not exist.`);
        return 'An Error Occured! (guild not found?)'
    } else { guildDoc = guildDoc.data() }

    // Clear existing sessions:
    async function clearExistingSessions() {
        // Delete Previous Signup Messages:
        try {
            const sessionAnnounceChannel = await global.client.channels.fetch(guildDoc.sessionSignUp_Channel);
            await sessionAnnounceChannel.bulkDelete(100)
                .then(messages => {
                    if(global.outputDebug_General) {console.log(`[⚙️] Deleted ${messages.size} messages from ${sessionAnnounceChannel.name}`)}
                })
                .catch(console.warn);
        } catch (error) {
            console.log(`{!} Couldn't delete previous signup messages for guild:`, guildId);
            console.log(error);
        }

        // Errase Guild's Previous Sessions:
        await db.collection('guilds').doc(String(guildId)).set({
            sessions: null
            }, { merge: true }).then(() => {
                if (global.outputDebug_InDepth) {console.log(`Session erased for: ${guildId}`)}
            }).catch((error) => {
                console.error("[FIREBASE] Error erasing sessions: ", error);
            });
    }
    await clearExistingSessions(guildId)

    // Wait 1s (for deletion to finish):
	await new Promise(resolve => setTimeout(resolve, 1000)); 

    // Debug:
    if(global.outputDebug_General) {console.log(`[⚙️] Adding today's sessions...`)}

    // Create each session by time:
    for (const eventTimeHour of times) {
        
        // Generate Timestamp:
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
        dateUTC.setUTCHours(eventTimeHour + timezoneOffsetHours, 30, 0, 0); // X:30 CST/CDT in UTC
    
        // Return timestamp:
        const discordTimestamp = Math.floor(dateUTC.getTime() / 1000);

        // Save Session to Database:
        await sessionManager.createSession(guildId, discordTimestamp)
    }

    // Wait 1s (for creation to finish):
	await new Promise(resolve => setTimeout(resolve, 1000)); 

    // Prepair sessions signup message in announcement channel:
    const messageContent = await sessionManager.getRefreshedSignupMessage(guildId)
    if(!messageContent){ return console.log(`{!} An error occured when sending the session singup message:`, messageContent) }
    const announcementChannel = await global.client.channels.fetch(guildDoc.sessionSignUp_Channel);
    if(!announcementChannel){ return console.log(`{!} An error occured when sending the session singup message:`, 'Cannot get annoucement channel') }

    // Send sessions signup message in announcement channel:
    const signupMessage = await announcementChannel.send({
        components : [messageContent],
        flags: MessageFlags.IsComponentsV2
    }).catch(err => {
        console.error("{!} Failed to send signup message:", err);
        return null;
    });

    // Save Session Signup Message ID in Database:
    await db.collection('guilds').doc(String(guildId)).update({
        sessionsSignup_MessageId : signupMessage.id
    }).catch(err => {
        console.error('{!!!} An error occured when saving a session signup message id. This is a fatal erorr and needs to be addressed!', err)
    })

    // Debug - Complete:
    if(global.outputDebug_General) {console.log('[✅] Complete!')}
}


// Start Session Creation Schedule:
async function startSchedule() {
    try {
        const cron = require('node-cron');

        // Schedule the function to run every day at 10:15 AM CST
        cron.schedule('00 6 * * *', // MM HH (time to excecute)
            () => { // function to excecute
                createEvents('593097033368338435');
            },
            { // schedule options
                scheduled: true,
                timezone: 'America/Chicago' // Ensures it's CST/CDT
            }
        );

        // Call the function on bot start up:
        await createEvents('593097033368338435');

        // ------------------------ Testing Session Manager V2 ------------------------

        // sessionManager.assignUserSessionRole('593097033368338435', 'e_mayjb25xs53z', 'USER_ID', 'host')
        // const updateData = await sessionManager.assignUserSessionRole('593097033368338435', 'e_mayjb25xs53z', '298796807323123712', 'trainer')
        // console.log(`Session Update Attempt:`, updateData)
        // sessionManager.getRefreshedSignupMessage('593097033368338435')
        

        // Debug
        if(global.outputDebug_General) {
            const timestamp = new Date().toLocaleString('en-US', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Chicago'
            });
            console.log(`[⚙️] Session Scheduler Initiated! - ${timestamp}`);
        }

    } catch (error) {
        // Error Occured:
        console.warn('[❗️] Session Scheduler Failed to Initialize:');
        console.log(error)
    }
}


// Export:
module.exports = {
    startSchedule,
}