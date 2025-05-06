const { MessageFlags } = require('discord.js');

module.exports = {
    data: {
        customId: 'eventSignup',
    },
    async execute(interaction) {
        // Handle button click logic here
        await interaction.reply({ 
            content: `✅ You've(<@${interaction.user.id}>) signed up for an event!`,
            flags: MessageFlags.Ephemeral
        });
    }
}