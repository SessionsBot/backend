// Imports:
import {  Events, ChannelType, PermissionsBitField  } from "discord.js";
import global from "../utils/global.js";
import guildManager from "../utils/guildManager.js";
import logtail from "../utils/logs/logtail.js";
import {  DateTime  } from "luxon";




// Event Execution:
export default {
    name: Events.GuildDelete,
    /** @param {import('discord.js').Guild} guild */
    async execute(guild) {
        // Debug - Leaving Guild:
        if(global.outputDebug_InDepth) {
            console.log('guildDelete Event Fired!:')
            console.log(`guildID: ${guild.id}`)
        }
        const removedAtDateString = DateTime.fromMillis(guild?.joinedTimestamp).setZone('America/Chicago').toLocaleString(DateTime.DATETIME_FULL)
        logtail.info(`[-] Guild ${guild?.name} (${guild?.id}) has removed Sessions Bot!`, {guildName: guild?.name, memberCount: guild?.memberCount, removedAt: removedAtDateString});

        // Move guild to archive within database:
        await guildManager.guilds(guild.id).archiveGuild(guild);
    }
}