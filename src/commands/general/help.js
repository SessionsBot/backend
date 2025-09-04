import { CommandInteraction, ActionRowBuilder, ButtonBuilder, ContainerBuilder, MessageFlags, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder, InteractionContextType, ButtonStyle } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription(`Need help? Use this command for support resources.`)
        .setContexts(InteractionContextType.Guild)
    ,

    /** @param {CommandInteraction} interaction */
    execute: async (interaction) => {
        await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                .setAccentColor(0xeb883d)
                .addTextDisplayComponents(new TextDisplayBuilder({content: `## 🤔 Need Help?`}))
                .addSeparatorComponents(new SeparatorBuilder())
                .addActionRowComponents(new ActionRowBuilder()
                    .addComponents(new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel('Bot Commands')
                        .setURL(`https://docs.sessionsbot.fyi/commands`)
                    )
                    .addComponents(new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel('Documentation')
                        .setURL(`https://docs.sessionsbot.fyi`)
                    )
                    .addComponents(new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel('More Resources')
                        .setURL(`https://sessionsbot.fyi/support`)
                    )
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder({content: `-# Still need help? You can [send an email](mailto:support@sessionsbot.fyi) to our Support Team.`}))
            ]
        })
    }
    
}