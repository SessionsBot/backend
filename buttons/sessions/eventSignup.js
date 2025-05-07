const {
	MessageFlags,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ComponentType,
	EmbedBuilder,
} = require('discord.js');

const sessionManager = require('../../utils/sessions/sessionManager.js')

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
					.setValue('Event Host'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Training Crew')
					.setDescription('The crew responsible for training employees divided by groups.')
					.setValue('Training Crew'),
			);

		const row_selectEventRole = new ActionRowBuilder().addComponents(selectRoleMenu);

		// Send the select role message and store reply
		await interaction.reply({
			content: 'Select your role for this event:',
			components: [row_selectEventRole],
            flags: MessageFlags.Ephemeral
		});

		// Await reply:
        const reply = await interaction.fetchReply();

		// Create a collector for the select menu response:
		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 60_000, // 1 minute timeout
		});

		collector.on('collect', async (selectInteraction) => {
			// Confirm same user who triggered the signup
			if (selectInteraction.user.id !== interaction.user.id) {
				return await selectInteraction.reply({ content: "This menu isn't for you.", ephemeral: true });
			}

			// Get choice:
			const selectedRole = selectInteraction.values[0];

			// Update & retreive session data:
			const sessionData = await sessionManager.updateSessionRole(interactionEventId, selectedRole, selectInteraction.user.id)

			// Respond:
			await selectInteraction.update({
				content: `<@${selectInteraction.user.id}>`,
				embeds: [
					new EmbedBuilder()
						.setColor('#eb9234')
          				.setTitle('✅ Position Assigned!')
						.addFields( // Spacer
							{ name: ' ', value: ' ' }
						)
						.addFields(
							{ name: '💼 Role:', value: '`' + selectedRole + '`', inline: true },
							{ name: '📆 Date:', value: `<t:${sessionData.date}:F>\n(<t:${sessionData.date}:R>)`, inline: true }
						)          
						.addFields( // Spacer
							{ name: ' ', value: ' ' }
						)
						.setFooter({ text: `This message will be deleted in 15 seconds.`, iconURL: interaction.client.user.displayAvatarURL() })
				],
				components: []
			});

			// Schedule Confirmation Msg Deletion:
			setTimeout(() => {
				selectInteraction.deleteReply().catch(() => {});
			}, 15_000);

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
