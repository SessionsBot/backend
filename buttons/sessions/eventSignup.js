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

		// Send the select role message and store reply
		await interaction.reply({
			content: 'Select your role for this event:',
			components: [row_selectEventRole],
	        withReply: true, // ✅ replaces fetchReply
            flags: MessageFlags.Ephemeral,
		});

		// Await reply:
        const reply = await interaction.fetchReply();

		// Create a collector for the select menu response:
		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 60_000, // 1 minute timrout
		});

		collector.on('collect', async (selectInteraction) => {
			// Confirm same user who triggered the signup
			if (selectInteraction.user.id !== interaction.user.id) {
				return await selectInteraction.reply({ content: "This menu isn't for you.", ephemeral: true });
			}

			// Get choice:
			const selectedRole = selectInteraction.values[0];

			// Respond:
			await selectInteraction.update({
				content: `<@${selectInteraction.user.id}> ✅ You selected **${selectedRole}**! (${interactionEventId})`,
				components: [],
			});

			// ...

		});

        // On Response Collect Timeout:
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
