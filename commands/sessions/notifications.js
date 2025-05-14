const { // Import Discord.js
    EmbedBuilder, 
    InteractionContextType, 
    SlashCommandBuilder, 
    MessageFlags,
    SlashCommandBooleanOption,
    CommandInteraction,
    messageLink,
} = require('discord.js');

const sessionManager = require('../../utils/sessions/sessionManager');
const global = require('../../global')

// Register Command:
const data = new SlashCommandBuilder()
    .setName('notifications')
    .setDescription('Enable or disable upcoming event notifications.')
    .setContexts(InteractionContextType.Guild)
    .addBooleanOption(option =>
			option
				.setName('enabled')
				.setDescription('[TRUE] = Enables event notifications  |  [FALSE] = Disables event notifications')
				.setRequired(true))
    .addBooleanOption(option =>
			option
				.setName('only-assigned')
				.setDescription(`[TRUE] = Only notifies events you're assigned  |  [FALSE] = Sends ALL event notifications`)
				.setRequired(true))


// On Command Excecution:
async function execute(interaction) {

    // Get selections:
    let userChoice_notificationsEnabled = interaction.options.getBoolean('enabled');
    let userChoice_onlyAssigned = interaction.options.getBoolean('only-assigned');

    // If User Non-DM-able | Send Alert:
    const sendNonDMableAlert = async () => {
        // Send Alert:
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle('❗️ - Uh Oh!')
                .setDescription(`*This bot user cannot send you DM messages!* You **won't receive event notifications** until you edit your privacy settings...`)
                .setColor(global.colors.error)
            ],
            flags: MessageFlags.Ephemeral
        })
    }
    
    try { // DM User:
        const dmChannel = await interaction.user.createDM(true)
        const userAcceptsDMs = await dmChannel.isSendable()

        // If Non-DM-able - Return:
        if(!userAcceptsDMs) return await sendNonDMableAlert()

        // Defer Reply

        // Send DM Msg:
        await dmChannel.send({
            embeds: [
                new EmbedBuilder()
                .setTitle('⚙️ - Notifcation Adjusted:')
                .setDescription(`Below are your currently selected options:`)
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
        }, 1500)

    } catch (error) { // Error DMing User:
        // Send Alert:
       await sendNonDMableAlert()
    }
    
}

module.exports = {
    data,
    execute
};
