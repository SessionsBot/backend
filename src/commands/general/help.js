import { CommandInteraction, ActionRowBuilder, ButtonBuilder, ContainerBuilder, MessageFlags, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder, InteractionContextType, ButtonStyle } from "discord.js";
import global from "../../utils/global.js";

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
                new ContainerBuilder({
                    accent_color: 0xeb883d,
                    components: [
                        new TextDisplayBuilder({content: `## 🤔 Need Help?`}),
                        new TextDisplayBuilder({content: `-# Lets get your sessions running smoothly!`}),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `> Experiencing strange reoccurring issues? \n> > View our [Status Page](https://status.sessionsbot.fyi)`}),
                        new TextDisplayBuilder({content: `> Looking to get in touch with someone? \n> > Join our Support Server or send an [email](mailto:support@sessionsbot.fyi).`}),
                        new SeparatorBuilder(),
                        new ActionRowBuilder({
                            components:[
                                new ButtonBuilder({
                                    style: ButtonStyle.Link,
                                    label: 'Support Server',
                                    url: global.supportServerInvite_Url
                                }),
                                new ButtonBuilder({
                                    style: ButtonStyle.Link,
                                    label: 'Documentation',
                                    url: 'https://docs.sessionsbot.fyi'
                                }),
                                new ButtonBuilder({
                                    style: ButtonStyle.Link,
                                    label: 'More Resources',
                                    url: 'https://sessionsbot.fyi/support'
                                }),
                            ]
                        }),
                        new SeparatorBuilder()
                    ]
                })
            ]
        })
    }
    
}