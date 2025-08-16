// Imports:
const { Events, ChannelType, PermissionsBitField } = require('discord.js');
const global = require('../utils/global')
const guildManager = require('../utils/guildManager');



// Event Execution:
module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        // Debug - Leaving Guild:
        if(global.outputDebug_InDepth) {
            console.log('guildDelete Event Fired!:')
            console.log(`guildID: ${guild.id}`)
        }

        // Move guild to archive within database:
        await guildManager.guilds(guild.id).archiveGuild();
    }
}