const { // Import Discord.js
    EmbedBuilder, 
    InteractionContextType, 
    SlashCommandBuilder, 
    MessageFlags,
    SlashCommandBooleanOption,
    CommandInteraction,
} = require('discord.js');

const sessionManager = require('../../utils/sessions/sessionManager');

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
				.setName('only-upcoming')
				.setDescription(`[TRUE] = Only notifies events you're assigned  |  [FALSE] = Sends ALL event notifications`)
				.setRequired(true))


// On Command Excecution:
async function execute(interaction) {

    // Get selections:
    let userChoice_notificationsEnabled = interaction.options.getBoolean('enabled');
    let userChoice_onlyUpcoming = interaction.options.getBoolean('only-upcoming');

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
        const userAcceptsDMs = dmChannel.isSendable()

        // If Non-DM-able - Return:
        if(!userAcceptsDMs) return await sendNonDMableAlert()

        // Send DM Msg:
        await dmChannel.send({
            content: 'Notification Command Used! | Selection: ' + '`' + userChoice_notificationsEnabled + '` ' + '`' + userChoice_onlyUpcoming + '`'
        });

    } catch (error) { // Error DMing User:
        // Send Alert:
       await sendNonDMableAlert()
    }
    
}

module.exports = {
    data,
    execute
};
