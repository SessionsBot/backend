import { // Import Discord.js
    EmbedBuilder, 
    InteractionContextType, 
    SlashCommandBuilder, 
    MessageFlags,
    SlashCommandBooleanOption,
    CommandInteraction,
    messageLink,
} from 'discord.js';

import global from "../../utils/global.js";

// Register Command:
const data = new SlashCommandBuilder()
    .setName('my-notifications')
    .setDescription("Toggles session notifications. DMs must be enabled to receive them.")
    .setContexts(InteractionContextType.Guild)
    .addBooleanOption(option =>
			option
				.setName('enabled')
				.setDescription('[TRUE] = Enables session notifications  |  [FALSE] = Disables session notifications')
				.setRequired(true))
    .addBooleanOption(option =>
			option
				.setName('only-assigned')
				.setDescription(`[TRUE] = Only notifies sessions you're assigned  |  [FALSE] = Sends ALL session notifications`)
				.setRequired(true))


// On Command Execution:
async function execute(interaction) {

    // Get selections:
    let userChoice_notificationsEnabled = interaction.options.getBoolean('enabled');
    let userChoice_onlyAssigned = interaction.options.getBoolean('only-assigned');

    // If User NonDM-able | Send Alert:
    const sendNonDMableAlert = async () => {
        // Send Alert:
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle('❗️ - Uh Oh!')
                .setDescription(`*This bot user cannot send you DM messages!* You **won't receive session notifications** until you edit your privacy settings...`)
                .setColor(global.colors.error)
            ],
            flags: MessageFlags.Ephemeral
        })
    }
    
    try { // DM User:
        const dmChannel = await interaction.user.createDM(true)
        const userAcceptsDMs = await dmChannel.isSendable()

        // If NonDM-able - Alert & Return:
        if(!userAcceptsDMs) return await sendNonDMableAlert()

        // Send DM Msg:
        await dmChannel.send({
            embeds: [
                new EmbedBuilder()
                .setTitle('⚙️ - Notification Adjusted:')
                .setDescription(`Below are your currently selected options: \n *Please note:* Notifications are not yet enabled as we slowly roll out this feature!`)
                .setColor(global.colors.warning)
                .addFields(
                    {name: 'Notifications Enabled', value: '`'+userChoice_notificationsEnabled+'`'},
                    {name: 'Only Assigned', value: '`'+userChoice_onlyAssigned+'`'},
                )
                .setTimestamp()
            ]
        });

        // Respond to Command:
        await interaction.reply({
            content: `📩 | <@${interaction.user.id}> | Please check your Direct Messages!`,
            flags: MessageFlags.Ephemeral
        })

        // Schedule Deletion of Command Response:
        setTimeout(async () => {
            try {
				await interaction.deleteReply();
            } catch (err) {
                console.warn('[!] Failed to delete reply (likely already deleted or ephemeral):', err.message);
            }
        }, 7_000)

    } catch (error) { // Error DMing User:
        // Send Alert:
       await sendNonDMableAlert()
    }
    
}

export default{
    data,
    execute
};
