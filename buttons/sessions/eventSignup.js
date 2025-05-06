const {
	MessageFlags,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ComponentType,
	EmbedBuilder,
} = require('discord.js');

module.exports = {
	data: {
		customId: 'eventSignup',
	},
	async execute(interaction) {
		const interactionData = interaction.customId.split(':');
		const interactionCustomId = interactionData[0];
		const interactionEventId = interactionData[1];

		// Create Select Role Menu
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

		const row_selectEventRole = new ActionRowBuilder().addComponents(selectRoleMenu);

		// Send the ephemeral menu message and store the reply
		const reply = await interaction.reply({
			content: 'Select your role for this event:',
			components: [row_selectEventRole],
			ephemeral: true,
			fetchReply: true, // 🔥 Important: allows collector to attach to the message
		});

		// Create a component collector for the select menu
		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 60_000, // 1 minute
		});

		collector.on('collect', async (selectInteraction) => {
			// Check it's the same user who triggered the signup
			if (selectInteraction.user.id !== interaction.user.id) {
				return await selectInteraction.reply({ content: "This menu isn't for you.", ephemeral: true });
			}

			const selectedRole = selectInteraction.values[0];

			// You can now respond, update the event, or whatever
			await selectInteraction.update({
				content: `✅ You selected **${selectedRole}**!`,
				components: [],
			});

			// Optionally update the original event message if needed
			// You could fetch that here using the interactionEventId, etc.
		});

		collector.on('end', (collected, reason) => {
			if (reason === 'time') {
				reply.edit({
					content: '⏱️ Time expired. Please click the sign up button again.',
					components: [],
				}).catch(() => {});
			}
		});
	},
};
