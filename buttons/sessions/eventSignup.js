const { MessageFlags } = require('discord.js');

module.exports = {
    data: {
        customId: 'eventSignup',
    },
    async execute(interaction) {

        // Parese interaction.customId data:
			const interactionData = interaction.customId.split(':');
			const interactionCustomId = interactionData[0];
			const interactionArg2 = interactionData[1];
			const interactionArg3 = interactionData[2];

        // Debug:
            console.log('EVENT SIGNUP:')
            console.log('interaction.customId:', interaction.customId);
            console.log('interactionCustomId:', interactionCustomId);
            console.log('interactionArg2:', interactionArg2);
            console.log('interactionArg3:', interactionArg3);

        // Respond:
        await interaction.reply({ 
            content: `✅ (<@${interaction.user.id}>) You've signed up for an event! Selected Position: ${interactionArg3} (ID: ${interactionArg3})`,
            flags: MessageFlags.Ephemeral
        });
    }
}