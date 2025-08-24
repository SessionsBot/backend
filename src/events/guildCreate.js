// Imports:
import {  Events, ChannelType, PermissionsBitField  } from "discord.js";
import global from "../utils/global.js";
import guildManager from "../utils/guildManager.js";
import logtail from "../utils/logtail.js";

// Event:
export default {
    name: Events.GuildCreate,
    async execute(guild) {
        // Debug New Guild:
        if(global.outputDebug_InDepth) {
            console.log('guildCreate Event Fired!:')
            console.log(`guildID: ${guild.id}`)
        }

        logtail.info(`Guild ${guild?.name}(${guild?.id}) has added Sessions Bot!`);

        // 1. Add New Guild to Database:
        const addGuildResult = await guildManager.guilds(guild.id).createNewGuild()
        if(!addGuildResult.success){
            // CRITICAL ERROR: Failed to add new guild to database!
            return console.warn('Failed to add new guild to database!', addGuildResult.data)
        }

        
        // Send Welcome/Setup Message:
        const welcomeMessage = `👋 Hi! I'm your new bot. Please visit ${global.frontend_Url}/api/guild-setup?guildId=${guild.id}`;

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

        // 3. Attempt to send in any chat-able channel:
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
            logtail.error('No suitable greeting message location for newly joined guild!', {guildId: guild?.id, guildName: guild?.name});
            return console.warn(`{!} CRITICAL ERROR: Failed to send welcome/setup message for ${guild.name}.`);
        }
        

    }
}