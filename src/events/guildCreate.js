// Improts:
const { Events, ChannelType, PermissionsBitField } = require('discord.js');
const global = require('../utils/global')

// Event:
module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        // Debug New Guild:
        // if(global.outputDebug_InDepth) {
            console.log('guildCreate Event Fired!:')
            console.log(`guildID: ${guild.id}`)
        // }
        
        // Send Welcome/Setup Message:
        const welcomeMessage = `👋 Hi! I'm your new bot. Please visit https://sessionsbot.fyi/api/guild-setup?guildId=${guild.id}`;

        // 1. Attempt to send in default system channel:
        if (
            guild.systemChannel &&
            guild.systemChannel.viewable &&
            guild.systemChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
        ){
            try {
                await guild.systemChannel.send(welcomeMessage);
                console.log('Sent welcome message to system channel.');
                return;
            } catch (err) {
                console.warn('Failed to send to system channel:', err);
            }
        }

        // 2. Attempt to send in any chattable channel:
        const fallbackChannel = guild.channels.cache.find(channel =>
            channel.type === ChannelType.GuildText &&
            channel.viewable &&
            channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
        );

        if (fallbackChannel) {
            try {
                await fallbackChannel.send(welcomeMessage);
                console.log(`Sent welcome message to channel: ${fallbackChannel.name}`);
                return;
            } catch (err) {
                console.warn(`Failed to send to fallback channel (${fallbackChannel.name}):`, err);
            }
        }

        // 3. Direct message server owner:
        try {
            const owner = await guild.fetchOwner();
            await owner.send(`Thanks for adding me to **${guild.name}**!\n\n${welcomeMessage}`);
            console.log('Sent welcome message to guild owner via DM.');
            return;
        } catch (err) {
            console.warn('Failed to DM the guild owner:', err);
        }


        // 4. [ERROR!] No welcome/setup message destination:
        return console.warn(`{!} CRITICAL ERROR: Failed to send welcome/setup message for ${guild.name}.`);

    }
}