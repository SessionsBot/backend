// Imports:
import {  Events, ChannelType, ButtonBuilder, PermissionsBitField, ContainerBuilder, SeparatorBuilder, SectionBuilder, TextDisplayBuilder, ButtonStyle, MessageFlags, ThumbnailBuilder, ActionRowBuilder  } from "discord.js";
import global from "../utils/global.js";
import guildManager from "../utils/guildManager.js";
import logtail from "../utils/logs/logtail.js";

// Event:
export default {
    name: Events.GuildCreate,
    /** @param {import('discord.js').Guild} guild */
    async execute(guild) {

        // Log New Guild:
        logtail.info(`[+] Guild ${guild?.name} (${guild?.id}) has added Sessions Bot!`); logtail.flush();

        
        // 1. Add New Guild to Database:
        const addGuildResult = await guildManager.guilds(guild.id).createNewGuild()
        if(!addGuildResult.success){
            // CRITICAL ERROR: Failed to add new guild to database!
            logtail.error('Failed to add new guild to database!', addGuildResult.data); logtail.flush();
            return
        }

        
        // 2. Build Welcome/Setup Message:
        const welcomeMessage = new ContainerBuilder() // `👋 Hi! I'm your new bot. Please visit ${global.frontend_Url}/api/guild-setup?guildId=${guild.id} to get started.`;
        // const separator = new SeparatorBuilder()
        welcomeMessage.setAccentColor(0xb28ef6)

        const setupButton = new ButtonBuilder()
            .setLabel('Setup Bot')
            .setEmoji('🥳')
            .setStyle(ButtonStyle.Link)
            .setURL(`${global.frontend_Url}/api/guild-setup?guildId=${guild.id}`);

        const helpButton = new ButtonBuilder()
            .setLabel('Need Help?')
            .setEmoji('🤔')
            .setStyle(ButtonStyle.Link)
            .setURL(`${global.frontend_Url}/support`);

        

        const section = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder()
                .setContent(`## Welcome to Sessions Bot! \n *Please click below to setup your server...* \n @here`))
            .setThumbnailAccessory(new ThumbnailBuilder()
                .setURL(`https://avatars.githubusercontent.com/u/220646615?s=200&v=4`)
                .setDescription('Sessions Bot Logo'))
        welcomeMessage.addSectionComponents(section);

        welcomeMessage.addActionRowComponents(new ActionRowBuilder().setComponents([setupButton, helpButton]));

        


        // 3. Attempt to send in default system channel:
        if (
            guild.systemChannel &&
            guild.systemChannel.viewable &&
            guild.systemChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
        ){
            try {
                await guild.systemChannel.send({
                    components: [welcomeMessage],
                    flags: MessageFlags.IsComponentsV2
                });
                return;
            } catch (err) {
                console.warn('Failed to send to system channel:', err);
                if(err?.code === 50013 || err?.code == 50001 || err?.code == 50007) // Permission Error
                    return // await sendPermsDeniedAlert(interaction?.guildId, 'Send Welcome Message');
                
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
                    components: [welcomeMessage],
                    flags: MessageFlags.IsComponentsV2
                });
                return;
            } catch (err) {
                console.warn(`Failed to send to fallback channel (${fallbackChannel.name}):`, err);
                if(err?.code === 50013 || err?.code == 50001 || err?.code == 50007) // Permission Error
                    return await sendPermsDeniedAlert(interaction?.guildId, 'Send Welcome Message');
            }
        }

        // 5. Direct message server owner:
        try {
            const owner = await guild.fetchOwner();
            await owner.send({
                    components: [welcomeMessage],
                    flags: MessageFlags.IsComponentsV2
                });
            return;
        } catch (err) {
            console.warn('Failed to DM the guild owner:', err);
            logtail.error('{!} CRITICAL ERROR: No suitable greeting message location for newly joined guild!', {guildId: guild?.id, guildName: guild?.name});
            return 
        }

    }
}