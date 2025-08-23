// Imports:
import {  Events, ChannelType, PermissionsBitField  } from "discord.js";
;
import global from "../utils/global";
import guildManager from "../utils/guildManager";
import logtail from "../utils/logtail.ts";
import {  DateTime  } from "luxon";




// Event Execution:
export default {
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