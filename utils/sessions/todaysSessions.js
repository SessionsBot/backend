const {
    EmbedBuilder,  
    MessageFlags,
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle  
} = require('discord.js'); // Import Discord.js

const global = require('../../global.js') // Import Global Variables

const sessionManager = require('./sessionManager'); // Import Session Manager

// Generate Id:
function generateId() {
    return 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Generate Timestamp:
function generateTimestamp(hourOfDay = 10) {
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


// Clear Existing Sessions:
async function clearExistingSessions() {
    if(global.outputDebug_General) {console.log('[⚙️] Clearing existing sessions...')}
    await sessionManager.writeSessions({});
    if(global.outputDebug_InDepth) {console.log('[✅] Complete!')}
}

// Generate Todays Training Sessions:
async function generateTodaysTrainingSessions(client) {

    if(global.outputDebug_General) {console.log(`[⚙️] Adding today's sessions...`)}

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

    // Get Event Announcement Channel:
	// const channelId = '1369505812552224869';
	const channel = await client.channels.fetch(global.event_channelId);
    const sessions = await sessionManager.readSessions();

    // Clear Existing Messages:
    channel.bulkDelete(100)
        .then(messages => {
            if(global.outputDebug_General) {console.log(`[⚙️] Deleted ${messages.size} messages from ${channel.name}`)}
        })
        .catch(console.error);

    // Wait for 1 second (!! - for deletion to finish):
	await new Promise(resolve => setTimeout(resolve, 1000));

    // Send Event Messages in Channel:
    for (const [sessionId, session] of Object.entries(sessions)) {
      
        const embed = new EmbedBuilder()
            .setColor('#9BE75B')
            .setTitle('📋 - Training Session')
            .addFields( // Spacer
                { name: ' ', value: ' ' }
            )
            .addFields(
                { name: '📆 Date:', value: `<t:${session.date}:F>\n(<t:${session.date}:R>)`, inline: true },
                { name: '📍 Location:', value: `[Event Game](${session.location})`, inline: true }
            )
            .addFields( // Spacer
                { name: ' ', value: ' ' }
            )
            .addFields(
                { name: '🎙️ Host:', value: session.host ? '> ' + session.host : '*`Available`* \n *(0/1)*', inline: true },
                { 
                    name: '🤝 Trainers:', 
                    value: session.trainers.length > 0 
                      ? session.trainers.map(id => `<@${id}>`).join('\n') 
                      : '*`Available`* \n *(0/3)*', 
                    inline: true 
                  }
                  
            )          
            .addFields( // Spacer
                { name: ' ', value: ' ' }
            )
            .setFooter({ text: `ID: ${sessionId.toUpperCase()}`, iconURL: client.user.displayAvatarURL() });
      
        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`eventSignup:${sessionId}`)
            .setLabel('📝 Sign Up')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setLabel('🎮 Game Link')
            .setURL(session.location || 'https://roblox.com') // fallback if null
            .setStyle(ButtonStyle.Link)
        );
      
        // Send follow-up for each event
        const message = await channel.send({
          embeds: [embed],
          components: [buttons],
          content: '<@&1142632642064420925>'
        });

        // Update the session data with message/channel ids
        await sessionManager.saveSession(sessionId, {
            ...session, // keeps exisiting data
            messageId: message.id,
            channelId: channel.id
        });
    }

    // Debug:
    if(global.outputDebug_General) {console.log('[✅] Complete!')}
    const debugSessionsOnCreation = false;
    if (debugSessionsOnCreation) {
        console.log('[📋] All sessions:');
        const updatedSessionsData = await sessionManager.readSessions();
        console.log(updatedSessionsData);
    }

}


// Module Exports:
module.exports = {
	clearExistingSessions,
	generateTodaysTrainingSessions
};