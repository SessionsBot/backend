const {
	MessageFlags,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ComponentType,
	EmbedBuilder,
} = require('discord.js'); // Import Discord.js

const global = require('../../global.js') // Import Global Variables
const sessionManager = require('../../utils/sessions/sessionManager.js') // Import Session Manager

module.exports = {
	data: {
		customId: 'eventLeaveRole',
	},
	async execute(interaction) {
		const interactionData = interaction.customId.split(':');
		const interactionCustomId = interactionData[0];
		const interactionEventId = interactionData[1];

		// Debug:
		if(global.outputDebug_InDepth) {
			console.log('USER HAS ATTEMPTED A ROLE UNASSIGN!')
			console.log('EventId:', interactionEventId)
		}
		
		// Attempt to leave role:
		const [updateSuccess, sessionData] = await sessionManager.removePlayerFromEventById(interactionEventId, interaction.user.id)

		if (updateSuccess) {
			// Update Success:
			interaction.reply({
				embeds: [
					new EmbedBuilder()
					.setTitle('Role Unassign:')
					.setColor('#9BE75B')
					.addFields( // Spacer
						{ name: ' ', value: ' ' }
					)
					.addFields(
						{ name: '**✅ Success:**', value: '`You have successfully removed yourself as an attendee from this event!`' + `\n (${interactionEventId})` },
					)
					.addFields( // Spacer
						{ name: ' ', value: ' ' }
					)
				],
				flags: MessageFlags.Ephemeral
			})

		} else {
			// Update Error:
			interaction.reply({
				embeds: [
					new EmbedBuilder()
					.setTitle('Role Unassign:')
					.setColor('#fc035e')
					.addFields( // Spacer
						{ name: ' ', value: ' ' }
					)
					.addFields(
						{ name: '**⚠️ Error:**', value: '`When attempting to remove yourself from your role assignment, an error occurred! Please contact administrator help for more assistance`' },
					)
					.addFields( // Spacer
						{ name: ' ', value: ' ' }
					)
				],
				flags: MessageFlags.Ephemeral
			})
		}

		
	},
};
