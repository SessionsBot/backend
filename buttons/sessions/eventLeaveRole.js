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
	},
};
