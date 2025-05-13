const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const sessionManager = require('../../utils/sessions/sessionManager');

const data = new SlashCommandBuilder()
    .setName('notifications')
    .setDescription('Enable or disable upcoming event notifications.')
    .setContexts(InteractionContextType.Guild)

async function execute(interaction) {
    await interaction.reply({
        content: 'Notification Command Used!',
        flags: MessageFlags.Ephemeral
    });
}

module.exports = {
    data,
    execute
};
