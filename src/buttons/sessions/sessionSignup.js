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
		customId: 'sessionSignup',
	},
	async execute(interaction) {
		// Parese Interaction Data:
		const [interactionId, interactionSessionId] = interaction.customId.split(':');


		// Get Session Data:
		const guildId = interaction.message.guildId
		const guildSessions = await sessionManager.getSessions(guildId)
		const requestedSessionData = guildSessions[interactionSessionId]
		const sessionSignupMessageId = guildSessions.sessionsSignupMessageId

		// Confirm Data:
		if(!requestedSessionData) {
			return console.warn(`{!} Couldn't find session data!`)
		}

		
		// Confirm positions available:
		const sessionHostTaken = (requestedSessionData['host'] != null);
		const sessionTrainersCount = requestedSessionData['trainers'].length;
		const trainersFull = (sessionTrainersCount >= 3);
		const userAlreadyInSession = requestedSessionData['host'] === interaction.user.id || requestedSessionData['trainers'].includes(interaction.user.id);

		// User already in session:
		if(userAlreadyInSession){
			// Get current role:
			const usersRoleName = function() {
				// Session Host:
				if (requestedSessionData['host'] === interaction.user.id) {
					return 'Session Host'
				}
				// Training Crew:
				if (requestedSessionData['trainers'].includes(interaction.user.id)) {
					return 'Training Crew'
				}
				// Unknown:
				return 'Unknown'
			}
			// Send alert:
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
					.setColor('#d43f37')
					.setTitle('❗️ - Already Assigned Session!')
					.setDescription('Could not sign up again for this session! To edit your position within this session please use the `/my-sessions` command!')
					.addFields({name: '💼 Current Role', value: '`' + usersRoleName() + '`'})
  					.setFooter({ text: `This message will be deleted in 15 seconds.`, iconURL: interaction.client.user.displayAvatarURL() })
				],
				flags: MessageFlags.Ephemeral
			})

			// Schedule deletion:
			setTimeout(async () => {
				try {
					await interaction.deleteReply();
				} catch (err) {
					console.warn('[!] Failed to delete reply (likely already deleted or ephemeral):', err.message);
				}
			}, 15_000);

			// Cancel Excecution:
			return 
		}

		// No positions availble:
		if(sessionHostTaken && trainersFull){
			// Repond - Cancel:
			await interaction.reply({
				components: [],
				embeds: [
					new EmbedBuilder()
						.setColor('#eb9234')
						.setTitle('❗️ - Session at Capacity!')
						.addFields( // Spacer
							{ name: ' ', value: ' ' }
						)
						.addFields(
							{ name: '🧾 Details:', value: '` There are no positions within this session currently available, please check back later! `', inline: true },
						)          
						.addFields( // Spacer
							{ name: ' ', value: ' ' }
						)
						.setFooter({ text: `This message will be deleted in 15 seconds.`, iconURL: interaction.client.user.displayAvatarURL() })
				],
				flags: MessageFlags.Ephemeral
			});

			// Update Original Session Message: (hides sign up button if not already)
			sessionManager.getRefreshedSignupMessage(guildId, sessionSignupMessageId)

			// Schedule response message deletion:
			setTimeout(async () => {
				try {
					await interaction.deleteReply();
				} catch (err) {
					console.warn('[!] Failed to delete reply (likely already deleted or ephemeral):', err.message);
				}
			}, 15_000);

			return // Cancel excecution

		} else { // Positions availble - Continue:
		
			// Create Select Role Menu:
			 // Get available roles:
			let roleSelections = []
			const selectOption_Host = new StringSelectMenuOptionBuilder()
					.setLabel('Session Host')
					.setDescription('The main instructor who shall guide and facilitate the meeting.')
					.setValue('Session Host');
			const selectOption_Trainer = 
				new StringSelectMenuOptionBuilder()
					.setLabel('Training Crew')
					.setDescription('The crew responsible for training employees divided by groups.')
					.setValue('Training Crew');
			if(!sessionHostTaken){roleSelections.push(selectOption_Host)}
			if(!trainersFull){roleSelections.push(selectOption_Trainer)}

			// Selection Menu:
			const selectRoleMenu = new StringSelectMenuBuilder()
				.setCustomId(`selectSessionRole:${interactionSessionId}`)
				.setPlaceholder('Choose a role!')
				.addOptions(roleSelections);

			const row_selectSessionRole = new ActionRowBuilder().addComponents(selectRoleMenu);

			// Send the select role message and store reply
			await interaction.reply({
				content: 'Select your role for this session:',
				components: [row_selectSessionRole],
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
				const [assignRoleSuccess, sessionData] = await sessionManager.assignUserSessionRole(guildId, interactionSessionId, interaction.user.id, selectedRole)

				// Update Signup Message:
				await sessionManager.getRefreshedSignupMessage(guildId, sessionSignupMessageId)

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
				setTimeout(async () => {
					try {
						await selectInteraction.deleteReply();
					} catch (err) {
						console.warn('[!] Failed to delete reply (likely already deleted or ephemeral):', err.message);
					}
				}, 15_000);

			});

			// On Response Collect Timeout:
			collector.on('end', (collected, reason) => {
				if (reason === 'time') {
					interaction.editReply({
						content: '⏱️ Time expired. Please click the sign up button again.',
						components: [],
					}).catch(() => {});
				}
			});

		}

	},
};
