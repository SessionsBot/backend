import { ContainerBuilder, ButtonBuilder, ButtonStyle, SeparatorBuilder, PermissionsBitField, ChannelType, TextDisplayBuilder, ActionRowBuilder, MessageFlags } from "discord.js";
import global from "../global.js";
import logtail from "../logs/logtail.js";

const recentlyAlerted = [];
function trackNewAlert(guildId){
    recentlyAlerted.push(guildId)

    setTimeout(()=>{
        const guildIndex = recentlyAlerted.findIndex((itm) => itm == guildId)
        if(guildIndex && guildIndex != -1) recentlyAlerted.splice(guildIndex, 1)
    },5_000)
}

const permissionMessage = new ContainerBuilder({
    accent_color: 0xeb883d,
    components: [
        new TextDisplayBuilder({content: `## ⚠️ Uh oh! I'm missing my required permissions!`}),
        new TextDisplayBuilder({content: `It appears somewhere along the way my default **permissions have been altered**. This will interfere with my functionality!`}),
        new SeparatorBuilder(),
        new TextDisplayBuilder({content: `### *You can easily..* `}),
        new SeparatorBuilder(),
        new TextDisplayBuilder({content: `> **🔄 Re-Invite the Bot:** \nYou can quickly refresh the internal role/permissions Sessions Bot needs for your server by re-inviting the bot. \n-# **NOTE: DO NOT REMOVE/KICK THE BOT: Doing so will DELETE your bot configuration** and break any existing sessions/schedules! Simply re-invite the bot while its already a member within this server.`}),
        new SeparatorBuilder(),
        new TextDisplayBuilder({content: `### *But also...* `}),
        new SeparatorBuilder(),
        new TextDisplayBuilder({content: `> **🧐 MAKE SURE** <@1137768181604302848> has **ALL** of its required permission within **ANY SIGNUP CHANNELS** you've setup! \n-# Check individual channel/category permission overrides that may be causing issues... \n-# **NOTE:** Re-inviting the bot will ***NOT*** resolve this issue.`}),
        new SeparatorBuilder(),
        new TextDisplayBuilder({content: `> **🔧 Manually Fixing Permissions:** \nTo manually re-assign Sessions Bot its required permissions check: \n1. **\`Server Settings > Roles > Sessions > Edit > Permissions\`** \n2. **\`[SIGNUP CHANNEL] > Edit Channel > Permissions > Sessions \`** \nSee documentation for ***required permissions*** and confirm each are granted.\ \n-# Feeling lazy? You can grant **all permissions** to Sessions Bot with the 'Administrator' permission.`}),
        new SeparatorBuilder(),
        new ActionRowBuilder({
            components: [
                new ButtonBuilder()
                .setLabel("🔄 Re-invite Bot")
                .setStyle(ButtonStyle.Link)
                .setURL(global.reInvite_Url),
                new ButtonBuilder()
                .setLabel("📃 See Documentation")
                .setStyle(ButtonStyle.Link)
                .setURL('https://docs.sessionsbot.fyi/getting-started#required-bot-permissions'),
            ]
        }),
        new SeparatorBuilder(),
        new TextDisplayBuilder({content: `@here | [Need Help?](https://sessionsbot.fyi/support)`}),
    ]
})


/** ### Discord Permission Denied Alerter
 * Call this function whenever there is a Discord API permission based error.
 * 
 * 1. First attempts to send alert/msg in default system channel
 * 2. Then attempts to send within ANY guild channel
 * 3. Finally, will attempt to DM guild owner
 * 
 * If all above fails: stores error log
 */
export const sendPermsDeniedAlert = async (guildId, actionTitle) => { try {
    // 0. Check if already alerted recently:
    if(recentlyAlerted.find((item) => item == guildId))
        return
    // 1. Fetch guild using bot client:
    const botClient = global.client;
    const guild = await botClient.guilds.fetch(guildId);

    // 2. Debug:
    logtail.warn(`[!] Guild is missing required perms for ${actionTitle}!`, {guildId});

    // 3. Attempt to send in default system channel:
    if ( guild?.systemChannel?.viewable && guild.systemChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)){
        try {
            await guild.systemChannel.send({
                components: [permissionMessage],
                flags: MessageFlags.IsComponentsV2
            })
            return trackNewAlert(guildId);
        } catch (err) {
            // logtail.warn(`{!} Failed to send permission alert to system channel - guildId: ${guildId}`, err);
            return
        }
    }

    // 4. Attempt to send in any chat-able channel:
    const fallbackChannel = guild.channels.cache.find(channel =>
        channel.type === ChannelType.GuildText &&
        channel.viewable &&
        channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
    );

    if (fallbackChannel) {
        try {
            await fallbackChannel.send({
                components: [permissionMessage],
                flags: MessageFlags.IsComponentsV2
            })
            return trackNewAlert(guildId);
        } catch (err) {
            logtail.warn(`{!} Failed to send permission alert to fallback channel - guildId: ${guildId}`, err);
        }
    }

    // 5. Direct message server owner:
    try {
        const owner = await guild.fetchOwner();
        await owner.send({
            components: [permissionMessage],
            flags: MessageFlags.IsComponentsV2
        })
        return trackNewAlert(guildId);
    } catch (err) {
        logtail.error(`{!} No suitable permission alert message location for guild! - guildId: ${guildId}`, {guildId: guild?.id, guildName: guild?.name, ownerId: guild.ownerId, errDetails: err});
        return
    }

} catch (err) {
    // Failed - Log Error:
    logtail.warn(`{!} Failed to send permissions denied alert within guild(${guildId}).`, {errorDetails: err});
}}
    
