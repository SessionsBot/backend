// Imports:
const { Events, ChannelType, PermissionsBitField } = require('discord.js');
const global = require('../utils/global')
const guildManager = require('../utils/guildManager');
const logtail = require('../utils/logtail.ts')
const { DateTime } = require('luxon')



// Event Execution:
module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        // Debug - Leaving Guild:
        if(global.outputDebug_InDepth) {
            console.log('guildDelete Event Fired!:')
            console.log(`guildID: ${guild.id}`)
        }
        const joinedAtDateString = DateTime.fromSeconds(guild?.joinedTimestamp).toLocaleString(DateTime.DATETIME_FULL)
        logtail.info(`Guild ${guild?.id} has removed Sessions Bot!`, {guildName: guild?.name, memberCount: guild?.memberCount, joinedAt: joinedAtDateString});

        // Move guild to archive within database:
        await guildManager.guilds(guild.id).archiveGuild();
    }
}