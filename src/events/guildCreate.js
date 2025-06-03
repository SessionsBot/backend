// Improts:
const { Events, ChannelType, PermissionsBitField } = require('discord.js');
const global = require('../utils/global')
const guildManager = require('../utils/guildManager');

// Event:
module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        // Debug New Guild:
        if(global.outputDebug_InDepth) {
            console.log('guildCreate Event Fired!:')
            console.log(`guildID: ${guild.id}`)
        }


        // 1. Add New Guild to Database:
        const addGuildResult = await guildManager.createNewGuildDoc(guild.id);
        if(!addGuildResult.success){
            // CRITICAL ERROR: Failed to add new guild to database!
            return console.warn('Failed to add new guild to database!', addGuildResult.data)
        }

        
        // Send Welcome/Setup Message:
        const welcomeMessage = `👋 Hi! I'm your new bot. Please visit ${global.frontend_Url}api/guild-setup?guildId=${guild.id}`;

        // 2. Attempt to send in default system channel:
        if (
            guild.systemChannel &&
            guild.systemChannel.viewable &&
            guild.systemChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
        ){
            try {
                await guild.systemChannel.send(welcomeMessage);
                return;
            } catch (err) {
                console.warn('Failed to send to system channel:', err);
            }
        }

        // 3. Attempt to send in any chattable channel:
        const fallbackChannel = guild.channels.cache.find(channel =>
            channel.type === ChannelType.GuildText &&
            channel.viewable &&
            channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
        );

        if (fallbackChannel) {
            try {
                await fallbackChannel.send(welcomeMessage);
                return;
            } catch (err) {
                console.warn(`Failed to send to fallback channel (${fallbackChannel.name}):`, err);
            }
        }

        // 4. Direct message server owner:
        try {
            const owner = await guild.fetchOwner();
            await owner.send(`Thanks for adding me to **${guild.name}**!\n\n${welcomeMessage}`);
            return;
        } catch (err) {
            console.warn('Failed to DM the guild owner:', err);
            return console.warn(`{!} CRITICAL ERROR: Failed to send welcome/setup message for ${guild.name}.`);
        }
        

    }
}