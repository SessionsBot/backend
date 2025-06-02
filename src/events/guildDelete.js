// Improts:
const { Events, ChannelType, PermissionsBitField } = require('discord.js');
const global = require('../utils/global')
const guildManager = require('../utils/guildManager');
const { db } = require('../utils/firebase')

// Function to move guild to archive:
async function moveGuildToArchive(guildId) {
    const guildRef = db.collection('guilds').doc(guildId);
    const archivedRef = db.collection('archivedGuilds').doc(guildId);

    try {
        // 1. Read original doc
        const doc = await guildRef.get();

        if (!doc.exists) {
            console.warn(`Guild document ${guildId} does not exist.`);
            return { success: false, error: 'Document not found' };
        }

        const data = doc.data();

        // 2. Write to archive
        await archivedRef.set({
            ...data,
            archivedAt: new Date()
        });

        // 3. Delete original
        await guildRef.delete();

        console.log(`Guild ${guildId} moved to archive successfully.`);
        return { success: true };
    } catch (err) {
        console.error(`Failed to move guild ${guildId} to archive:`, err);
        return { success: false, error: err };
    }
}

// Event Excecution:
module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        // Debug - Leaving Guild:
        if(global.outputDebug_InDepth) {
            console.log('guildDelete Event Fired!:')
            console.log(`guildID: ${guild.id}`)
        }

        // Move guild to archive within database:
        await moveGuildToArchive(guild.id);
    }
}