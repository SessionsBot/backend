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
		customId: 'eventLeaveRole',
	},
	async execute(interaction) {
		const interactionData = interaction.customId.split(':');
		const interactionCustomId = interactionData[0];
		const interactionEventId = interactionData[1];

		console.log('USER HAS ATTEMPTED A ROLE UNASSIGN!')
		console.log('EventId:', interactionEventId)

		// Attempt to leave role:
		const [updateSuccess, sessionData] = sessionManager.removePlayerFromEventById(interactionEventId, interaction.user.id)

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
	},
};
