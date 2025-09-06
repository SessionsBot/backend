// Imports:

import { ButtonInteraction, MessageFlags } from "discord.js";
import { sendPermsDeniedAlert } from "../../utils/responses/permissionDenied.js";

// Export Button:
export default {
    data: {
        customId:'deleteSignupChannelMsg'
    },
    /** Main execution of button:
     * @param {ButtonInteraction} interaction
     */
    execute: async (interaction) => {
        try { 
            (await interaction.message.fetch(true)).delete() 
        }catch(e) {
            // Failed to delete:
            if(e?.code === 50013) { // Permission Error
                await sendPermsDeniedAlert(interaction?.guildId, 'Delete Message');
            }
            console.log(`{!} Failed to delete new signup channel msg:`, e, {guildId: interaction.guild.id, actor: interaction.user.username})
            interaction.reply({
                content: '-# Failed to delete message... Please try again!',
                flags: MessageFlags.Ephemeral
            })
        }
    }
}