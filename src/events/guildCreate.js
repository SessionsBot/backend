// Improts:
const { Events } = require('discord.js');
const { execute } = require('./interactionCreate');

// Event:
module.exports = {
    name: Events.GuildCreate,
    async execute(newGuild) {
        // Debug New Guild:
        console.log('guildCreate Event Fired!:')
        console.log(`guildID: ${newGuild.id}`)
        console.log(`newGuild: ${newGuild}`)
    }
}