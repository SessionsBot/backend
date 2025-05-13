const { // Import Discord.js
    EmbedBuilder, 
    InteractionContextType, 
    SlashCommandBuilder, 
    MessageFlags,
    SlashCommandBooleanOption,
} = require('discord.js');

const sessionManager = require('../../utils/sessions/sessionManager');

const data = new SlashCommandBuilder()
    .setName('notifications')
    .setDescription('Enable or disable upcoming event notifications.')
    .setContexts(InteractionContextType.Guild)
    .addBooleanOption(option =>
			option
				.setName('enabled')
				.setDescription('[TRUE] = Enables event notifications | [FALSE] = Disables event notifications')
				.setRequired(true))
    .addBooleanOption(option =>
			option
				.setName('onlyUpcoming')
				.setDescription(`[TRUE] = Only notifies events you're assigned | [FALSE] = Sends all event notifications`)
				.setRequired(true))

async function execute(interaction) {

    // Get selections:
    let userChoice_notificationsEnabled = interaction.options.getBoolean('enabled');
    let userChoice_onlyUpcoming = interaction.options.getBoolean('onlyUpcoming');

    await interaction.reply({
        content: 'Notification Command Used! | Selection: ' + '`' + userChoice_notificationsEnabled + '` ' + '`' + userChoice_onlyUpcoming + '`',
        flags: MessageFlags.Ephemeral
    });
}

module.exports = {
    data,
    execute
};
