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
            // flags: MessageFlags.Ephemeral,
		});

        const reply = await interaction.fetchReply();

		// Create a collector for the select menu
		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 60_000, // 1 minute
		});

		collector.on('collect', async (selectInteraction) => {
			// Confirm same user who triggered the signup
			if (selectInteraction.user.id !== interaction.user.id) {
				return await selectInteraction.reply({ content: "This menu isn't for you.", ephemeral: true });
			}

			const selectedRole = selectInteraction.values[0];

			// Respond:
			await selectInteraction.update({
				content: `✅ You selected **${selectedRole}**!`,
				components: [],
			});

            // Event Embed:
            let event1Date = new Date();
            event1Date.setHours(event1Date.getHours() + 1);
            event1Date.setMinutes(event1Date.getMinutes() + 45);
            const event1timestamp = Math.floor(event1Date.getTime() / 1000);

            const updatedEventEmbed = new EmbedBuilder()
            .setColor('#DD5BE7')
            .setAuthor({ name: `Updated Session:`, iconURL: 'https://cdn-icons-png.flaticon.com/512/1869/1869397.png' })
            .addFields(
                { name: '📆 Date:', value: `<t:${event1timestamp}:F> 
                (<t:${event1timestamp}:R>)`, inline: true },
                { name: '📍 Location:', value: '   [Game Link](https://roblox.com)', inline: true },

            )
            .addFields(
                { name: '\u200B', value: '\u200B' }, // Spacer
            )
            .addFields(
                { name: '🎙️ Host:', value: `   *<@${interaction.user.id}>* `, inline: true },
                { name: '🤝 Trainers:', value: 
                `   *<@${interaction.user.id}> 
                (1/3)*`, inline: true },
            )
            .setFooter({ text: `ID: ${interactionEventId.toUpperCase()}` });

            // Update Original Event Message:
            await interaction.message.edit({
                embeds: [updatedEventEmbed]
            })

			// Optionally update the original event message if needed
		});

        // On Collector Timeout:
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
