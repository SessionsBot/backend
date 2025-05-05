const { MessageFlags } = require('discord.js');

module.exports = {
    data: {
        customId: 'eventSignup',
    },
    async execute(interaction) {
        // Handle button click logic here
        await interaction.reply({ 
            content: `✅ You've signed up for an event!`,
            flags: MessageFlags.Ephemeral
        });
    }
}