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
				.setDescription('TRUE = Enables Event Notifications, FALSE = Disables Event Notifications ')
				.setRequired(true))

async function execute(interaction) {

    // Get selections:
    let userChoice = interaction.options.getBoolean('enabled');

    await interaction.reply({
        content: 'Notification Command Used! | Selection: ' + '`' + userChoice + '`' ,
        flags: MessageFlags.Ephemeral
    });
}

module.exports = {
    data,
    execute
};
