import { ModalBuilder, CommandInteraction, SlashCommandBuilder, TextInputBuilder, TextInputStyle, InteractionContextType, MessageFlags, ActionRowBuilder, ModalSubmitInteraction } from "discord.js";
import { db } from "../../utils/firebase.js";
import { DateTime } from "luxon";
import { SelectMenuBuilder } from "@discordjs/builders";

const data = new SlashCommandBuilder()
    .setName('feedback')
    .setDescription("Provide your feedback regarding our Discord bot.")
    .setContexts(InteractionContextType.Guild)

/** Helper fn to save user feedback to database
 * @param {CommandInteraction} interaction 
 * @param {string} feedback 
 */
function saveFeedback(interaction, feedback){
    try {
        const dateString = DateTime.now().setZone('America/Chicago').toFormat("MM-dd-yyyy_hh:mm:ss_a");
        db.collection('events').doc('feedback').collection('users').doc(String(interaction.user.id)).set({
            [dateString]: {
                username: interaction?.user?.username,
                fromGuild: interaction.guild.name,
                feedback: feedback
            }
        }, {merge: true})
    } catch (err) {
        console.log(`{!} Failed to save user feedback to database!`, err);
    }
}
/** @param {CommandInteraction} interaction */
async function execute(interaction) {
    try {
        // Send feedback model:
        const modal = new ModalBuilder()
            .setTitle('🤖 Sessions Bot Feedback')
            .setCustomId('botFeedbackModal')

        // Add feedback text input:
        const feedbackText = new TextInputBuilder()
            .setStyle(TextInputStyle.Paragraph)
            .setCustomId('userFeedback')
            .setLabel('Your Feedback:')
            .setPlaceholder('I love this application...')
            .setRequired(true)

        modal.addComponents(
            new ActionRowBuilder().addComponents(feedbackText)
        )

        // Show/send feedback modal:
        await interaction.showModal(modal)

        // Await submission:
        const submitted = await interaction.awaitModalSubmit({
            time: 180_000,
            filter: (i) => i.customId === "botFeedbackModal" && i.user.id === interaction.user.id,
        }).catch(() => null);

        // Check submission:
        if(submitted){ // Success
            const feedback = submitted.fields.getTextInputValue("userFeedback");
            // Save feedback:
            saveFeedback(interaction, feedback);
            await submitted.reply({
                content: `✅ Thanks for your feedback: "${feedback}"`,
                flags: MessageFlags.Ephemeral,
            });
        } else { // Timeout
            await interaction.followUp({
                content: "⏰ You took too long to submit feedback. Try again with `/feedback`.",
                flags: MessageFlags.Ephemeral,
            });
        }
        

        

    } catch(err) { // Error Occurred
        console.log(`{!} Failed to execute /feedback cmd`, err);
    }
}

// Exports:
export default{
    data,
    execute
};