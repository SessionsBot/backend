import { CommandInteraction, ActionRowBuilder, ButtonBuilder, ContainerBuilder, MessageFlags, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder, InteractionContextType, ButtonStyle } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription(`Get a quick link to your Bot Dashboard.`)
        .setContexts(InteractionContextType.Guild)
    ,

    /** @param {CommandInteraction} interaction */
    execute: async (interaction) => {
        await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                .setAccentColor(0x573deb)
                .addTextDisplayComponents(new TextDisplayBuilder({content: `## 🕹️ Visit your Bot Dashboard`}))
                .addSeparatorComponents(new SeparatorBuilder())
                .addActionRowComponents(new ActionRowBuilder()
                    .addComponents(new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel('Bot Dashboard')
                        .setURL(`https://sessionsbot.fyi/dashboard`)
                    )
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder({content: `-# Keep in mind: You need the 'Manage Server' permission to access *most* servers via this link. \n*[Need Help?](https://sessionbot.fyi/support)*`}))
            ]
        })
    }
    
}