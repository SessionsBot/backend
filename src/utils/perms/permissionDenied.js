import { ContainerBuilder, ButtonBuilder, ButtonStyle, SeparatorBuilder, PermissionsBitField, ChannelType, TextDisplayBuilder, ActionRowBuilder, MessageFlags, Guild } from "discord.js";
import global from "../global.js";
import logtail from "../logs/logtail.js";
import guildManager from "../guildManager.js";

/** Cooldown Utility Class for Perms Denied Alerts */
class alertCooldown {
    constructor(timeout = 7000){
        this.recentlyAlerted = []
        this.timeout = timeout
    }

    start(guildId){
        this.recentlyAlerted.push(guildId);
        setTimeout(() => {
            const idx = this.recentlyAlerted.indexOf(guildId);
            if(idx !== -1) this.recentlyAlerted.splice(idx, 1)
        }, this.timeout);
    }

    onCooldown(guildId){
        return this.recentlyAlerted.includes(guildId)
    }
}
const cooldown = new alertCooldown()

/** Required Permissions for SessionsBot
 * @type { import("discord.js").PermissionResolvable[] } */
const requiredBotPerms = [
    "CreatePrivateThreads", "CreatePublicThreads", "EmbedLinks", "ManageChannels", 
    "ManageMessages", "ManageThreads", "MentionEveryone", "ReadMessageHistory", 
    "SendMessages", "SendMessagesInThreads", "ViewChannel"
]

/** Sends permission alert msg to a specified server with fallback methods
 * @param {Guild} guild 
 * @param {ContainerBuilder} messageContent 
 */
const sendMessageWFallback = async (guild, messageContent ) => { try {

    // 1. Attempt to send in default system channel:
    if ( guild?.systemChannel?.viewable && guild.systemChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)){
        try {
            await guild.systemChannel.send({
                components: [messageContent],
                flags: MessageFlags.IsComponentsV2
            })
            return cooldown.start(guild.id);
        } catch (err) { return }
    }

    // 2. Attempt to send in any chat-able channel:
    const fallbackChannel = guild.channels.cache.find(channel =>
        channel.type === ChannelType.GuildText &&
        channel.viewable &&
        channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
    );
    if (fallbackChannel) {
        try {
            await fallbackChannel.send({
                components: [messageContent],
                flags: MessageFlags.IsComponentsV2
            })
            return cooldown.start(guild.id);
        } catch (err) {
            logtail.warn(`{!} Failed to send permission alert to any fallback channel - guildId: ${guild.id}`, err);
        }
    }

    // 3. Direct message server owner:
    try {
        const owner = await guild.fetchOwner();
        await owner.send({
            components: [messageContent],
            flags: MessageFlags.IsComponentsV2
        })
        return cooldown.start(guild.id);
    } catch (err) {
        logtail.error(`{!} No suitable permission alert message destination for guild! - guildId: ${guild.id}`, {guildId: guild?.id, guildName: guild?.name, ownerId: guild.ownerId, errDetails: err});
        return
    }

} catch (err) {
    // Failed - Log Error:
    logtail.error(`{!} Failed to send permissions denied alert within guild(${guild.id}).`, {errorDetails: err});
}}


/** Check each required permission is granted to the bot within a specified server. */
export const sendPermsDeniedAlert = async (guildId, reasonString) => {try{
    // 1. Fetch Guild:
    const botClient = global?.client
    if(!guildId) throw 'Invalid Input - Missing "guildId"';
    if(!botClient) throw 'Error - Bot client not accessible!';
    const guild = await botClient.guilds.fetch(guildId)
    if(!guild) throw 'Error - Couldn\'t fetch guild!';

    // 2. Fetch Guild DB Data
    const guildDataFetchAttempt = await guildManager.guilds(guildId).readGuild()
    if(!guildDataFetchAttempt.success) throw `Error - Failed to fetch guild data from database!`
    const signupChannelId = guildDataFetchAttempt.data?.sessionSignup?.panelChannelId

    // 3 .Fetch Signup Channel:
    const signupChannel = signupChannelId ? await guild.channels.fetch(signupChannelId) : null
    
    // 4 .Get Granted Permissions:
    const guildBotRole = guild.roles.botRoleFor(botClient.user);
    if(!guildBotRole) throw `Error - Failed to fetch bot role within guild!`
    const guildBotRolePerms = guild.roles.botRoleFor(botClient.user).permissions.serialize(true)
    const guildBotRoleCHANNELPerms = signupChannel ? guild.roles.botRoleFor(botClient.user).permissionsIn(signupChannel).serialize(true) : []

    // 5. Confirm Required Perms are Granted Globally:
    /** @type {import("discord.js").PermissionResolvable[]} */
    let missingGlobalPerms = [];
    Object.entries(guildBotRolePerms).forEach(globalPerm => {
        // Check if perm required:
        if(requiredBotPerms.includes(globalPerm[0])){
            // Check if not granted:
            if(!globalPerm[1]){
                missingGlobalPerms.push(globalPerm[0])
            }
        }
    })

    // 6. Confirm Required Perms are Granted in SignupChannel:
    /** @type {import("discord.js").PermissionResolvable[]} */
    let missingSignupChannelPerms = [];
    Object.entries(guildBotRoleCHANNELPerms).forEach(channelPerm => {
        // Check if perm required:
        if(signupChannel && requiredBotPerms.includes(channelPerm[0])){
            // Check if not granted:
            if(!channelPerm[1]){
                missingSignupChannelPerms.push(channelPerm[0])
            }
        }
    })

    // 7. Build Permission Alert Message:
    const botRoleId = guild.roles.botRoleFor(guild.members.me.user).id
    const missingPermissionsMsg = new ContainerBuilder({
        accent_color: Number(global.colors.warning.replace('#', '0x')),
        components: [
            new TextDisplayBuilder({content: `## ⚠️ Uh oh! I'm missing required permissions..`}),
            new TextDisplayBuilder({content: `It appears somewhere along the way my **required permissions have been altered**. This **WILL** interfere with my functionality! \n@here`}),
            new SeparatorBuilder(),
            new TextDisplayBuilder({content: `### ${missingGlobalPerms.length ? '❌' : '✅'} SERVER-WIDE Permissions: \ \n-# These are permissions that must be granted by the <@&${botRoleId}> role for Sessions Bot within your server. You can adjust permissions in *"Server Settings"*.`}),
            new TextDisplayBuilder({content: `> ### Missing Permissions: \n` + (missingGlobalPerms.length ? `> - \`${Array.from(missingGlobalPerms).join('\`\n> - `') + '`'}` : '> - `NONE ✔︎`') }),
            new SeparatorBuilder(),
            new TextDisplayBuilder({content: `### ${missingSignupChannelPerms.length ? '❌' : '✅'} SIGNUP-CHANNEL Permissions: \ \n-# These are permissions that must be granted by the <@&${botRoleId}> role for Sessions Bot within your signup channel. ${!signupChannel ? `\ \n-# **NOTE:** You currently don't have a "Signup Channel" configured, you can disregard this section.` : `You can adjust permissions of your signup channel(<#${signupChannelId}>) in *"Channel Settings"*.`} `}),
            new TextDisplayBuilder({content: `> ### Missing Permissions: \n` + (missingSignupChannelPerms.length ? `> - \`${Array.from(missingSignupChannelPerms).join('\`\n> - `') + '`'}` : '> - `NONE ✔︎`') }),
            new SeparatorBuilder(),
            new TextDisplayBuilder({content: `### 📋 All Permissions Needed: \ \n-# This is the **FULL list** of permissions the Sessions Bot's role(<@&${botRoleId}>) requires both within this server and any setup *"Signup Channel"*.`}),
            new TextDisplayBuilder({content: `> \`${requiredBotPerms.join('`, `') + '`'}`}),
            new SeparatorBuilder(),
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder()
                        .setLabel("📃 See Documentation")
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://docs.sessionsbot.fyi/getting-started#required-bot-permissions'),
                        new ButtonBuilder()
                        .setLabel("❓ Get Support")
                        .setStyle(ButtonStyle.Link)
                        .setURL(global.supportServerInvite_Url)
                    ]
                }),
            new SeparatorBuilder(),
        ]
    })

    // 8. Send Message & Debug:
    await sendMessageWFallback(guild, missingPermissionsMsg);
    logtail.warn(`[!] Guild is missing required perms for ${reasonString}!`, {guildId, guildName: guild?.name, missingGlobalPerms, missingSignupChannelPerms});

} catch(err) {
    // Return error result
    logtail.warn(`[!] Failed to run permission checks for guild - ${guildId}`, {rawError: err});
    return {success: false, error: err}
}}