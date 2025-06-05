const {
	MessageFlags,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ComponentType,
	EmbedBuilder,
} = require('discord.js');

const guildManager = require('../../utils/guildManager.js');
const global = require('../../utils/global.js')

const responses = {

	databaseFailure: async (interaction, sessionId, responseTitle, responseString) => {
		// Send alert:
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
				.setColor(global.colors.error)
				.setTitle(responseTitle)
				.setDescription(responseString)
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

	},

	alreadyAssignedRole: async (interaction, sessionId, existingRoleAssigned) => {
		// Send alert:
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
				.setColor(global.colors.error)
				.setTitle('❗️ - Already Assigned Session!')
				.setDescription('Could not sign up again for this session! To edit your position within this session please use the `/my-sessions` command!')
				.addFields({name: '💼 Current Role', value: '`' + existingRoleAssigned + '`'})
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

	},

	roleAssignSuccess: async (interaction, sessionId, selectedRole, sessionData) => {
		// Send Role Assign Success Message:
		await interaction.update({
			content: `<@${interaction.user.id}>`,
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

		// Schedule response message deletion:
		setTimeout(async () => {
			try {
				await interaction.deleteReply();
			} catch (err) {
				console.warn('[!] Failed to delete reply (likely already deleted or ephemeral):', err.message);
			}
		}, 15_000);
	},

	roleAssignError: async (interaction, sessionId, responseString) => {
		// Send Role Assign Success Message:
		await interaction.update({
			content: `<@${interaction.user.id}>`,
			components: [],
			embeds: [
				new EmbedBuilder()
					.setColor('#eb3434')
					.setTitle('⚠️ Position Not Assigned!')
					.addFields( // Spacer
						{ name: ' ', value: ' ' }
					)
					.addFields(
						{ name: '🧾 Details:', value: '`' + responseString + '`', inline: true }
					)          
					.addFields( // Spacer
						{ name: ' ', value: ' ' }
					)
					.setFooter({ text: `This message will be deleted in 15 seconds.`, iconURL: interaction.client.user.displayAvatarURL() })
			],
			flags: MessageFlags.Ephemeral
		});

		// Schedule response message deletion:
		setTimeout(async () => {
			try {
				await interaction.deleteReply();
			} catch (err) {
				console.warn('[!] Failed to delete reply (likely already deleted or ephemeral):', err.message);
			}
		}, 15_000);
	}

}

module.exports = {
	data: {
		customId: 'sessionSignup',
	},
	async execute(interaction) {
		// Parese Interaction Data:
		const [interactionId, interactionSessionId] = interaction.customId.split(':');
		const userId = interaction.user.id


		// Get Guild Data:
		const guildId = interaction.message.guildId;
		const guildDataRetrieval = await guildManager.readGuildDoc(guildId);
		if(!guildDataRetrieval.success) return await responses.databaseFailure(interaction, interactionSessionId, '❗️ - Error Occured!', 'An internal server error occured! Cannot find guild data, please contact an administrator...');
		let guildData = guildDataRetrieval.data;


		// Get Session Data:
		let upcomingSessions = guildData['upcomingSessions'];
		let requestedSessionData = upcomingSessions[interactionSessionId];
		let sessionRoles = requestedSessionData['roles']
		if(!upcomingSessions || !requestedSessionData || !sessionRoles) return await responses.databaseFailure(interaction, interactionSessionId, '❗️ - Error Occured!', 'An internal server error occured! Cannot find session data, please contact an administrator...');


		// Check if User Already Assigned:
		let userAlreadyInSession = false;
		let exisitngRoleName = '';
		sessionRoles.forEach(role => {
			if(role['users'].includes(userId)) {
				userAlreadyInSession = true;
				exisitngRoleName = role['roleName'] || 'Undefined';
			}
		});
		if(userAlreadyInSession) return await responses.alreadyAssignedRole(interaction, interactionSessionId, exisitngRoleName)


		// Check Roles are Available:
		let availableRoles = []
		sessionRoles.forEach(role => {
			if(role['users'].length >= role['roleCapacity']) return
		 	else availableRoles.push(role)
		});
		if(!availableRoles.length) return await responses.databaseFailure(interaction, interactionSessionId, '❗️ - Session at Capacity!', 'This session currently has no available role positions. Please select a different session and try again.');


		// Create Role Select Menu:
		let selectMenuOptions = [];
		availableRoles.forEach(role => {
			const newOption = new StringSelectMenuOptionBuilder()
				.setLabel(role['roleName'])
				.setDescription(role['roleDescription'])
				.setValue(role['roleName']);
			selectMenuOptions.push(newOption)
		})
		const selectRoleMenu = new StringSelectMenuBuilder()
			.setCustomId(`selectSessionRole:${interactionSessionId}`)
			.setPlaceholder('Choose a role!')
			.addOptions(selectMenuOptions);
		const row_selectSessionRole = new ActionRowBuilder().addComponents(selectRoleMenu);


		// Send the Select Role Message:
		await interaction.reply({
			content: 'Select your role for this session:',
			components: [row_selectSessionRole],
			flags: MessageFlags.Ephemeral
		});


		// Await Response:
		const reply = await interaction.fetchReply();

		// Create a Collector for the Select Role Response:
		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			time: 60_000, // 1 minute timeout
		});


		// On Role Select Response - COLLECTION:
		collector.on('collect', async (selectInteraction) => {

			// Get Selected Role:
			const selectedRole = selectInteraction.values[0];

			// Attempt to Assign User - Database:
			const userAssignAttempt = await guildManager.guildSessions(guildId).assignUserSessionRole(interactionSessionId, userId, selectedRole)

			// Assign Success:
			if(userAssignAttempt.success){
				// Send Success Message:
				responses.roleAssignSuccess(selectInteraction, interactionSessionId, selectedRole, userAssignAttempt.sessionData)

				// Update Guilds Signup Message:
				await guildManager.guildSessions(guildId).updateSessionSignup()
			}

			// Assign Error:
			if(!userAssignAttempt.success){
				// Send Error Message:
				responses.roleAssignError(selectInteraction, interactionSessionId, userAssignAttempt.data)
			}

		})

		
		// On Role Select Response - CANCELED/TIMEOUT:
		collector.on('end', (collected, reason) => {
			if (reason === 'time') {
				interaction.editReply({
					content: '⏱️ Time expired. Please click the sign up button again.',
					components: [],
				}).catch(() => {});
			}
		});

	},
};
