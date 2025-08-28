import { CommandInteraction, ActionRowBuilder, ButtonBuilder, ContainerBuilder, MessageFlags, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder, InteractionContextType, ButtonStyle } from "discord.js";
import guildManager from "../../utils/guildManager.js";
import global from "../../utils/global.js";

const responses = {
    startSetup: (guildId) => new ContainerBuilder()
        .setAccentColor(0x6dc441)
        .addTextDisplayComponents(new TextDisplayBuilder({content: `## 🎉 Setup your new bot!`}))
        .addSeparatorComponents(new SeparatorBuilder())
        .addActionRowComponents(new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Begin Setup')
                .setURL(`https://sessionsbot.fyi/api/guild-setup?guildId=${guildId}`)
            )
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder({content: `-# Keep in mind: You need the 'Manage Server' permission in order to setup this server via this link.`}))
    ,
    errorOccurred: new ContainerBuilder()
        .setAccentColor(0xd43f37)
        .addTextDisplayComponents(new TextDisplayBuilder({content: `## 🤔 An error occurred!`}))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder({content: `-# An internal error occurred please try again later. If this issue persists, please contact [support](mailto:support@sessionsbot.fyi).`}))
    ,
    alreadySetup: new ContainerBuilder()
        .setAccentColor(0xfc9d03)
        .addTextDisplayComponents(new TextDisplayBuilder({content: `## 😁 Already Setup!`}))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder({content: `-# This server is already set up! If you'd like to further modify your settings/schedules visit your [bot dashboard](${global.frontend_Url}/dashboard).`}))
    ,
}

export default {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription(`Get your bot's initial setup link, to configure preferences. (not needed once server is setup)`)
        .setContexts(InteractionContextType.Guild)
    ,

    /** @param {CommandInteraction} interaction */
    execute: async (interaction) => {
        const guildId = interaction?.guild?.id
        // Check if this server is setup:
        const readResult = await guildManager.guilds(guildId).readGuild()
        if(!readResult?.success){ // read error:
            await interaction.reply({
                components: [responses.errorOccurred],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
            })
        }
        const setupCompleted = readResult?.data?.setupCompleted
        if(setupCompleted){ // already setup
            await interaction.reply({
                components: [responses.alreadySetup],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
            })
        } else { // setup-able
            await interaction.reply({
                components: [responses.startSetup(guildId)],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
            })
        }
    }
    
}