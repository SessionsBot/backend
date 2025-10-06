import { ContainerBuilder, MediaGalleryBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from 'discord.js';
import global from '../global.js'
import logtail from './logtail.js'
import { DateTime } from 'luxon';

// Discord Ids
const logGuildId = process.env?.['GUILD_ID_PUBLIC'];
const joinLeaveLogChannelId = '1424195270618644655';

const defaultGuildIcon = 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/198142ac-f410-423a-bf0b-34c9cb5d9609/dbtif5j-60306864-d6b7-44b6-a9ff-65e8adcfb911.png/v1/fit/w_125,h_125,q_70,strp/discord_metro_icon_by_destuert_dbtif5j-375w-2x.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NTEyIiwicGF0aCI6Ii9mLzE5ODE0MmFjLWY0MTAtNDIzYS1iZjBiLTM0YzljYjVkOTYwOS9kYnRpZjVqLTYwMzA2ODY0LWQ2YjctNDRiNi1hOWZmLTY1ZThhZGNmYjkxMS5wbmciLCJ3aWR0aCI6Ijw9NTEyIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.1Fi0jR0YCIK_seYmEuy6R_LyBrJM4K6HOPXAtsf-3yQ';


/** Logging methods to internal Discord Server! */ 
export default {

/** Log a specific event occurrence to logs. */
events: {

    /** Logs a guild that had just added Sessions Bot */
    guildAdded: async (guildId, guildName, createdAt, joinedAt, memberCount, guildIcon) => { try {

        // Convert Timestamp
        createdAt = Math.floor(DateTime.fromMillis(createdAt).toSeconds());
        joinedAt = Math.floor(DateTime.fromMillis(joinedAt).toSeconds());
        
        // Build 'Event Message'
        const container = new ContainerBuilder()
        const separator = new SeparatorBuilder()

        container.setAccentColor(Number(global.colors.success.replace('#', '0x')))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `## ✅ Bot Added to Server`}))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Name: \n> ${guildName}`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Created at: \n> <t:${createdAt}:F>`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Joined at: \n> <t:${joinedAt}:F>`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Member Count: \n> ${memberCount}`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Guild Icon:`}))
        container.addMediaGalleryComponents(new MediaGalleryBuilder({
            items: [
                {
                    description: 'Guild Icon',
                    media: {url: guildIcon || defaultGuildIcon}
                }
            ]
        }))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `-# Guild Id: ${guildId}`}))
        container.addSeparatorComponents(separator)


        // Fetch Log Channel
        const logGuild = await global.client.guilds.fetch(logGuildId);
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
    guildRemoved: async (guildId, guildName, wasSetup, joinedAt, memberCount, guildIcon) => {try {
        
        // Convert Timestamps
        joinedAt = Math.floor(DateTime.fromMillis(joinedAt).toSeconds());
        const leftAt = Math.floor(DateTime.now().toSeconds());

        // Build 'Event Message'
        const container = new ContainerBuilder()
        const separator = new SeparatorBuilder()

        container.setAccentColor(Number(global.colors.warning.replace('#', '0x')))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `## ❌ Bot Removed from Server`}))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Name: \n> ${guildName}`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Was Setup: \n> ${wasSetup}`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Joined at: \n> <t:${joinedAt}:F>`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Left at: \n> <t:${leftAt}:F>`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Member Count: \n> ${memberCount}`}))
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### Guild Icon:`}))
        container.addMediaGalleryComponents(new MediaGalleryBuilder({
            items: [
                {
                    description: 'Guild Icon',
                    media: {url: guildIcon || defaultGuildIcon}
                }
            ]
        }))
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `-# Guild Id: ${guildId}`}))
        container.addSeparatorComponents(separator)


        // Fetch Log Channel
        const logGuild = await global.client.guilds.fetch(logGuildId);
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