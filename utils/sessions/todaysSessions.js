const {
    EmbedBuilder,  
    MessageFlags,
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle  
} = require('discord.js'); // Import Discord.js

const sessionManager = require('./sessionManager'); // Import Session Manager

// Generate Id:
function generateId() {
    return 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Generate Timestamp:
function generateTimestamp(hourOfDay) {
	const now = new Date();
	const eventDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    eventDate.setDate(eventDate.getDate() + 1)
	eventDate.setHours(hourOfDay || 7, 30, 0, 0);
	return Math.floor(eventDate.getTime() / 1000);
}

// Clear Existing Sessions:
async function clearExistingSessions() {
    console.log('[⚙️] Clearing existing sessions...');
    await sessionManager.writeSessions({});
    // console.log('[✅] Complete!');
}

// Generate Todays Training Sessions:
async function generateTodaysTrainingSessions(client) {

    console.log(`[⚙️] Adding today's sessions...`);

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

    // Announce in channel after sessions are generated:
	const channelId = '1369505812552224869';
	const channel = await client.channels.fetch(channelId);
    const sessions = await sessionManager.readSessions();

    for (const [sessionId, session] of Object.entries(sessions)) {
      
        const embed = new EmbedBuilder()
          .setColor('#9BE75B')
          .setAuthor({ name: `Training Session`, iconURL: 'https://cdn-icons-png.flaticon.com/512/1869/1869397.png' })
          .addFields(
            { name: '📆 Date:', value: `<t:${session.date}:F>\n(<t:${session.date}:R>)`, inline: true },
            { name: '📍 Location:', value: `[Join Here](${session.location})`, inline: true }
          )
          .addFields( // Spacer
            { name: '\u200B', value: '\u200B' }
          )
          .addFields(
            { name: '🎙️ Host:', value: session.host || '*Available*', inline: true },
            { name: '🤝 Trainers:', value: Object.keys(session.trainers || {}).length + '/3', inline: true }
          )
          .setFooter({ text: `${sessionId}`, iconURL: client.user.displayAvatarURL() });
      
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
          components: [buttons]
        });

        // Update the session data with message/channel ids
        await sessionManager.saveSession(sessionId, {
            ...session, // keeps exisiting data
            messageId: message.id,
            channelId: channel.id
        });
    }

    // Debug:
    console.log('[✅] Complete!');
    const debugAllSessions = true
    if (debugAllSessions) {
        console.log('[📋] All sessions:');
        console.log(sessionManager.readSessions());
    }

}


// Module Exports:
module.exports = {
	clearExistingSessions,
	generateTodaysTrainingSessions
};