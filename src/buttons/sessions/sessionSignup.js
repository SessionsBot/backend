const {
	MessageFlags,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ComponentType,
	EmbedBuilder,
	ContainerBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
} = require('discord.js');

const guildManager = require('../../utils/guildManager.js');
const global = require('../../utils/global.js');
const { DateTime } = require('luxon');

const responses = {

	databaseFailure: async (interaction, sessionId, responseTitle, responseString) => {
		// Build Response:
		const container = new ContainerBuilder();
		const separator = new SeparatorBuilder();

		container.setAccentColor(0xd43f37);
		
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${responseTitle}`))
		container.addSeparatorComponents(separator);
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`*${responseString}* `))
		container.addSeparatorComponents(separator);
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# This message will be deleted in 15 seconds.`))

		// Send alert:
		await interaction.reply({
			components: [container],
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
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
		// Build Response:
		const container = new ContainerBuilder();
		const separator = new SeparatorBuilder();

		container.setAccentColor(0xd43f37);
		
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ❗️ - Already Assigned Session!`))
		container.addSeparatorComponents(separator);
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**💼 Current Role:** \`${existingRoleAssigned}\` `))
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent('*Could not sign up again for this session! To edit your position within this session please use the `/my-sessions` command!* '))
		container.addSeparatorComponents(separator);
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# This message will be deleted in 15 seconds.`))
		
		// Send alert:
		await interaction.reply({
			components: [container],
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
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

	pastSession: async (interaction, sessionId) => {
		// Build Response:
		const container = new ContainerBuilder();
		const separator = new SeparatorBuilder();

		container.setAccentColor(0xd43f37);
		
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⌛️ Session Already Occured!`))
		container.addSeparatorComponents(separator);
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**🧾 Details:** \n *You cannot sign up for this session, it has already taken place... Please choose a different session and try again!* `))
		container.addSeparatorComponents(separator);
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# This message will be deleted in 15 seconds.`))
		
		// Send Role Assign Success Message:
		await interaction.reply({
			components: [container],
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
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

	roleAssignSuccess: async (interaction, sessionId, selectedRole, sessionData) => {
		// Build Response:
		const container = new ContainerBuilder();
		const separator = new SeparatorBuilder();

		container.setAccentColor(0x6dc441);
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ✅ Position Assigned!`))
		container.addSeparatorComponents(separator);
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**💼 Role:** \`${selectedRole}\` `))
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**📆 Date:** <t:${sessionData['date']['discordTimestamp']}:F>\n(<t:${sessionData['date']['discordTimestamp']}:R>) `))
		container.addSeparatorComponents(separator);
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# This message will be deleted in 15 seconds.`))
		
		// Send Role Assign Success Message:
		await interaction.editReply({
			components: [container],
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
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
		// Build Response:
		const container = new ContainerBuilder();
		const separator = new SeparatorBuilder();

		container.setAccentColor(0xd43f37);
		
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⚠️ Position Not Assigned!`))
		container.addSeparatorComponents(separator);
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**🧾 Details:** \n *${responseString}* `))
		container.addSeparatorComponents(separator);
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# This message will be deleted in 15 seconds.`))
		
		// Send Role Assign Success Message:
		await interaction.editReply({
			components: [container],
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
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
		const guildDataRetrieval = await guildManager.guilds(guildId).readGuild();
		if(!guildDataRetrieval.success) return await responses.databaseFailure(interaction, interactionSessionId, '❗️ - Error Occured!', 'An internal server error occured! Cannot find guild data, please contact an administrator...');
		let guildData = guildDataRetrieval.data;


		// Get Session Data:
		let upcomingSessions = guildData?.['upcomingSessions'];
		let requestedSessionData = upcomingSessions?.[interactionSessionId];
		let sessionRoles = requestedSessionData?.['roles']
		const sessionDateDiscord = requestedSessionData?.['date']?.['discordTimestamp']
		const nowUTCSeconds = DateTime.now().toUnixInteger()
		if(!upcomingSessions || !requestedSessionData || !sessionRoles) return await responses.databaseFailure(interaction, interactionSessionId, '❗️ - Error Occured!', 'An internal server error occured! Cannot find session data, please contact an administrator...');

		// Check if Session Already Occured:
		const pastSession = nowUTCSeconds >= sessionDateDiscord;
		if (pastSession){
			await guildManager.guildSessions(interaction.message.guildId).updateSessionSignup(String(interactionSessionId), guildData)
			return await responses.pastSession(interaction, interactionSessionId)
		} 


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


		// Create Role Select Container:
		let selectRoleContainer = new ContainerBuilder()
		let separator = new SeparatorBuilder()

		// Title
		selectRoleContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('### 💼 Please select a role for this session:'))
		selectRoleContainer.addSeparatorComponents(separator) // Separator
		selectRoleContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`> **Date:** <t:${sessionDateDiscord}:F>`))
		selectRoleContainer.addSeparatorComponents(separator) // Separator


		// Create Role Select Menu:
		let selectMenuOptions = [];
		availableRoles.forEach(role => {
			const newOption = new StringSelectMenuOptionBuilder()
				.setLabel(role['roleEmoji'] + ' ' + role['roleName'])
				.setDescription(role['roleDescription'])
				.setValue(role['roleName']);
			selectMenuOptions.push(newOption)
		})
		const selectRoleMenu = new StringSelectMenuBuilder()
			.setCustomId(`selectSessionRole:${interactionSessionId}`)
			.setPlaceholder('Choose a role...')
			.addOptions(selectMenuOptions);
		const row_selectSessionRole = new ActionRowBuilder().addComponents(selectRoleMenu);
		
		// Complete Container:
		selectRoleContainer.addActionRowComponents(row_selectSessionRole)
		selectRoleContainer.addSeparatorComponents(separator)
		selectRoleContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Didn't mean to signup? Feel free to just ignore this message.`))


		// Send the Select Role Message:
		await interaction.reply({
			components: [selectRoleContainer],
			flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
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
				responses.roleAssignSuccess(interaction, interactionSessionId, selectedRole, userAssignAttempt.sessionData)
			}

			// Assign Error:
			if(!userAssignAttempt.success){
				// Send Error Message:
				responses.roleAssignError(interaction, interactionSessionId, userAssignAttempt.data)
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
