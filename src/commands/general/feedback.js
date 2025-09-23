import { ModalBuilder, ContainerBuilder, CommandInteraction, SlashCommandBuilder, TextInputBuilder, TextInputStyle, InteractionContextType, MessageFlags, ActionRowBuilder, ModalSubmitInteraction, SeparatorBuilder, TextDisplayBuilder, ButtonStyle } from "discord.js";
import { db } from "../../utils/firebase.js";
import { DateTime } from "luxon";
import logtail from "../../utils/logs/logtail.js";
import global from "../../utils/global.js";
import { ButtonBuilder } from "@discordjs/builders";

const data = new SlashCommandBuilder()
    .setName('feedback')
    .setDescription("Provide your feedback regarding Sessions Bot.")
    .setContexts(InteractionContextType.Guild)

/** @param {CommandInteraction} interaction */
async function execute(interaction) {
    try {
        // Build response message
        const feedbackUrl = 'https://sessionsbot.fyi/feedback';
        const container = new ContainerBuilder();
        const separator = new SeparatorBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder({content: `### 🙏 Thank you for using <@${global.client.user.id}>! \ \n-# Please take a short amount of time to complete a usage survey regarding *Sessions Bot* and it's features.`}))
        container.addSeparatorComponents(separator);
        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setURL(feedbackUrl)
                .setStyle(ButtonStyle.Link)
                .setLabel(`📝 Leave Feedback`)
            )
        )
        container.addSeparatorComponents(separator);

        // Response
        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        })


    } catch(err) { // Error Occurred
        console.warn('Failed to execute `/feedback` cmd for user', {rawError: err});
        logtail.warn('Failed to execute `/feedback` cmd for user', {rawError: err});
    }
}

// Exports:
export default{
    data,
    execute
};