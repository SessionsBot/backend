// Imports:
import {  Events, ChannelType, PermissionsBitField  } from "discord.js";
import global from "../utils/global.js";
import guildManager from "../utils/guildManager.js";
import logtail from "../utils/logs/logtail.js";
import {  DateTime  } from "luxon";
import scheduleManager from "../utils/scheduleManager.js";




// Event Execution:
export default {
    name: Events.GuildDelete,
    /** @param {import('discord.js').Guild} guild */
    async execute(guild) {
        // Destroy Session Schedule - If Exists:
        scheduleManager.cancelGuildSessionsPost(guild.id);

        // Debug - Leaving Guild:
        const joinedAtDate = DateTime.fromMillis(guild?.joinedTimestamp).setZone('America/Chicago').toLocaleString(DateTime.DATETIME_FULL);
        logtail.info(`[-] Guild ${guild?.name} (${guild?.id}) has removed Sessions Bot!`, {guildName: guild?.name, memberCount: guild?.memberCount, joinedAt: joinedAtDate});

        // Move guild to archive within database:
        await guildManager.guilds(guild.id).archiveGuild(guild);
    }
}