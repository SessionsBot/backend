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
		// Parese Interaction Data:
		const [interactionId, interactionEventId] = interaction.customId.split(':');

		// Get Session Data:
		const requestedSessionData = await sessionManager.getSession(interactionEventId)
		if(requestedSessionData === null){return console.warn(`{!} Couldn't find session data!`)}

		// Confirm positions available:
		const eventHostTaken = (requestedSessionData['host'] != null);
		const eventTrainersCount = requestedSessionData['trainers'].length;
		const trainersFull = (eventTrainersCount >= 3);

		// No positions availble:
		if(eventHostTaken && trainersFull){
			// Repond - Cancel:
			await interaction.reply({
				components: [],
				embeds: [
					new EmbedBuilder()
						.setColor('#eb9234')
						.setTitle('❗️ - Event at Capacity!')
						.addFields( // Spacer
							{ name: ' ', value: ' ' }
						)
						.addFields(
							{ name: '🧾 Details:', value: '` There are no positions within this event currently available, please check back later! `', inline: true },
						)          
						.addFields( // Spacer
							{ name: ' ', value: ' ' }
						)
						.setFooter({ text: `This message will be deleted in 15 seconds.`, iconURL: interaction.client.user.displayAvatarURL() })
				],
				flags: MessageFlags.Ephemeral
			});

			// Update Original Event Message: (hides sign up button if not already)
			sessionManager.refreshEventMessage(interactionEventId)

			// Schedule response message deletion:
			setTimeout(() => {
				selectInteraction.deleteReply().catch(() => {});
			}, 15_000);

			return // Cancel excecution

		} else { // Positions availble - Continue:
		
			// Create Select Role Menu:
			 // Get available roles:
			let roleSelections = []
			const selectOption_Host = new StringSelectMenuOptionBuilder()
					.setLabel('Event Host')
					.setDescription('The main instructor who shall guide and facilitate the meeting.')
					.setValue('Event Host');
			const selectOption_Trainer = 
				new StringSelectMenuOptionBuilder()
					.setLabel('Training Crew')
					.setDescription('The crew responsible for training employees divided by groups.')
					.setValue('Training Crew');
			if(!eventHostTaken){roleSelections.push(selectOption_Host)}
			if(!trainersFull){roleSelections.push(selectOption_Trainer)}

			// Selection Menu:
			const selectRoleMenu = new StringSelectMenuBuilder()
				.setCustomId(`selectEventRole:${interactionEventId}`)
				.setPlaceholder('Choose a role!')
				.addOptions(roleSelections);

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
				const [assignRoleSuccess, sessionData] = await sessionManager.updateSessionRole(interactionEventId, selectedRole, selectInteraction.user.id)

				if (assignRoleSuccess) {
					// SUCCESS - Respond:
					await selectInteraction.update({
						content: `<@${selectInteraction.user.id}>`,
						components: [],
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
						flags: MessageFlags.Ephemeral
					});

					// Update Original Event Message:
					sessionManager.refreshEventMessage(interactionEventId)

				} else {
					// ERROR - Respond:
					await selectInteraction.update({
						content: `<@${selectInteraction.user.id}>`,
						components: [],
						embeds: [
							new EmbedBuilder()
								.setColor('#eb3434')
								.setTitle('⚠️ Position Not Assigned!')
								.addFields( // Spacer
									{ name: ' ', value: ' ' }
								)
								.addFields(
									{ name: '🧾 Details:', value: '`' + sessionData + '`', inline: true }
								)          
								.addFields( // Spacer
									{ name: ' ', value: ' ' }
								)
								.setFooter({ text: `This message will be deleted in 15 seconds.`, iconURL: interaction.client.user.displayAvatarURL() })
						],
						flags: MessageFlags.Ephemeral
					});
				}
				
				// Schedule response message deletion:
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

		}

	},
};
