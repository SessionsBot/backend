const { MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: {
        customId: 'eventSignup',
    },
    async execute(interaction) {

        // Parese interaction.customId data:
			const interactionData = interaction.customId.split(':');
			const interactionCustomId = interactionData[0];
			const interactionEventId = interactionData[1];
			const interactionRoleSelected = interactionData[2];

        // Create Select Role Menu:
        const selectRoleMenu = new StringSelectMenuBuilder()
			.setCustomId(`selectEventRole:${interactionEventId}`)
			.setPlaceholder('Choose a role!')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('Event Host')
					.setDescription('The main instructor who shall guide and facilitate the meeting.')
					.setValue('Host'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Assistant')
					.setDescription('The crew responsible for training employees divided by groups.')
					.setValue('Assistant'),
			);

        // Respond:
        await interaction.reply({ 
            // content: `<@${interaction.user.id}> | ✅ | You've signed up for an event! 
            // Selected Position: ${interactionRoleSelected} 
            // (ID: ${interactionEventId})`,
            components: [selectRoleMenu],
            flags: MessageFlags.Ephemeral
        });
    }
}