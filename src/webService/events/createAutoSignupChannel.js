const { ChannelType, PermissionFlagsBits } = require('discord.js');
const global = require('../../utils/global.js')
const botToken = process.env['BOT_TOKEN'];


const global = require('../../utils/global.js'); // Assuming your client is stored here

const createAutoSignupChannel = async (guildId) => {
    try {
        const guild = await global.client.guilds.fetch(String(guildId));
        if (!guild) throw new Error('Guild not found / not joined');

        // Create 'Sessions' category:
        const sessionsCategory = await guild.channels.create({
            name: 'Sessions',
            type: ChannelType.GuildCategory,
            topic: 'This is the topic!',
            reason: 'This is the reason!',
            permissionOverwrites : [
                {
                    id: guild.roles.everyone,
                    deny: PermissionFlagsBits.ViewChannel
                }
            ]
        });

        // Create 'Session Signup' channel:
        const signupChannel = await guild.channels.create({
            name: '📋 Session Signup',
            type: ChannelType.GuildAnnouncement,
            topic: 'This is the topic!',
            reason: 'This is the reason!',
            permissionOverwrites : [
                {
                    id: guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });

        // Return Success:
        const result = {
            success: true,
            data: { 
                sessionsCategory: { 
                    categoryId: sessionsCategory.id, 
                    sessionsCategory 
                },
                signupChannel: { 
                    channelId: signupChannel.id, 
                    signupChannel
                } 
            } 
        };

        return result;

    } catch (e) {
        // Return Error:
        const result = { success: false, data: `{!} Couldn't create default signup channels`, error: e.message };
        console.log('{!}', result);
        return result;
    }
};

module.exports = { createAutoSignupChannel };