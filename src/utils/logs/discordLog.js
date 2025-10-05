import { ContainerBuilder, MediaGalleryBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from 'discord.js';
import global from '../global.js'
import logtail from './logtail.js'
import { DateTime } from 'luxon';

// Discord Ids
const logGuildId = process.env?.['GUILD_ID_PUBLIC'];
const joinLeaveLogChannelId = '1424195270618644655';

/** Logging methods to internal Discord Server! */ 
export default {

/** Log a specific event occurrence to logs. */
events: {

    /** Logs a guild that had just added Sessions Bot */
    guildAdded: async (guildId, guildName, createdAt, memberCount, ownerId, guildIcon) => { try {

        // Convert Timestamp
        createdAt = DateTime.fromMillis(createdAt).toSeconds();
        
        // Build 'Event Message'
        const container = new ContainerBuilder()
        const separator = new SeparatorBuilder()

        container.setAccentColor(Number(global.colors.success.replace('#', '0x')))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `## ✅ Bot Added to Server`}))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Name: \n> ${guildName}`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Created at: \n> <t:${createdAt}:F>`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Member Count: \n> ${memberCount}`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Owner Id: \n> <@${ownerId}>`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Guild Icon:`}))
        container.addMediaGalleryComponents(new MediaGalleryBuilder({
            items: [
                {
                    description: 'Guild Icon',
                    media: {url: guildIcon}
                }
            ]
        }))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `-# Guild Id: ${guildId}`}))
        container.addSeparatorComponents(separator)


        // Fetch Log Channel
        const logGuild = await global.client.guilds.fetch(guildId);
        if(!logGuild) throw `Failed to fetch guild for logging event`
        const logChannel = await logGuild.channels.fetch(joinLeaveLogChannelId)
        if(!logChannel) throw `Failed to fetch channel for logging event`
        
        await logChannel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        })

    } catch(err) { // Error Occurred
        logtail.warn(`[?] Failed to post event "Guild Added" to internal Discord Log.`, {err})
    }},

    /** Logs a guild that had just removed Sessions Bot */
    guildRemoved: async (guildId, guildName, wasSetup, joinedAt, createdAt, memberCount, ownerId, guildIcon) => {try {
        
        // Convert Timestamps
        createdAt = DateTime.fromMillis(createdAt).toSeconds();
        joinedAt = DateTime.fromMillis(joinedAt).toSeconds();

        // Build 'Event Message'
        const container = new ContainerBuilder()
        const separator = new SeparatorBuilder()

        container.setAccentColor(Number(global.colors.warning.replace('#', '0x')))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `## ❌ Bot Removed from Server`}))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Name: \n> ${guildName}`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Was Setup: \n> ${wasSetup}`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Created at: \n> <t:${createdAt}:F>`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Joined at: \n> <t:${joinedAt}:F>`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Member Count: \n> ${memberCount}`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Owner Id: \n> <@${ownerId}>`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Guild Icon:`}))
        container.addMediaGalleryComponents(new MediaGalleryBuilder({
            items: [
                {
                    description: 'Guild Icon',
                    media: {url: guildIcon}
                }
            ]
        }))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `-# Guild Id: ${guildId}`}))
        container.addSeparatorComponents(separator)


        // Fetch Log Channel
        const logGuild = await global.client.guilds.fetch(guildId);
        if(!logGuild) throw `Failed to fetch guild for logging event`
        const logChannel = await logGuild.channels.fetch(joinLeaveLogChannelId)
        if(!logChannel) throw `Failed to fetch channel for logging event`
        
        await logChannel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        })

    } catch(err) { // Error Occurred
        logtail.warn(`[?] Failed to post event "Guild Removed" to internal Discord Log.`, {err})
    }},

}



}