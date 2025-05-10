const {
	MessageFlags,
	ActionRowBuilder,
    ButtonBuilder, 
    ButtonStyle,
	ComponentType,
	EmbedBuilder
} = require('discord.js'); // Import Discord.js
const global = require('../../global.js') // Import Global Variables
const sessionManager = require('../../utils/sessions/sessionManager.js') // Import Session Manager

module.exports = {
	data: {
		customId: 'eventLeaveRole',
	},
	async execute(interaction_startUnassign) {
		const interactionData = interaction_startUnassign.customId.split(':');
		const interactionCustomId = interactionData[0];
		const interactionEventId = interactionData[1];

		// Debug:
		if(global.outputDebug_InDepth) {
			console.log('USER HAS ATTEMPTED A ROLE UNASSIGN!')
			console.log('EventId:', interactionEventId)
		}

		// Send/Await Confirmation Prompt:
		const sessionData = await sessionManager.getSession(interactionEventId)
		const usersRoleName = function() {
			// Event Host:
			if (sessionData['host'] === interaction_startUnassign.user.id) {
				return 'Event Host'
			}
			// Training Crew:
			if (sessionData['trainers'].includes(interaction_startUnassign.user.id)) {
				return 'Training Crew'
			}
			// Unknown:
			return 'Unknown'
		}
		// If user is already unassigned from this event:
		if (usersRoleName() === 'Unknown') {
			// Send Error Message:
			await interaction_startUnassign.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(global.colors.warning)
						.setTitle('❗️ - Uh oh!')
						.setDescription(`It looks like you're not assigned to this event! Please use`, '`/my-events`', `to view events you're currently signed up for.`)

				],
            	flags: MessageFlags.Ephemeral
			})
			return // End Excecution
		}
		const confirmationEmbed = new EmbedBuilder()
			.setColor(global.colors.warning)
			.setTitle('❗️ - Please Confirm:')
			.setDescription('Are you sure you would like to unassign yourself from this role?')
			.addFields( // Spacer
                    { name: ' ', value: ' ' }
                )
                .addFields(
                    { name: '📆 Date:', value: `<t:${sessionData['date']}:F>\n(<t:${sessionData['date']}:R>)`, inline: true },
                    { name: '💼 Role:', value: '`' + usersRoleName() + '`', inline: true }
                )
                .addFields( // Spacer
                    { name: ' ', value: ' ' }
                )

		const confirmationButtons = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`eventLeaveRoleConfirmation:${interactionEventId}:CONFIRM`)
				.setLabel('✅ Confirm')
				.setStyle(ButtonStyle.Danger),
			new ButtonBuilder()
				.setCustomId(`eventKeepRoleConfirmation:${interactionEventId}:CANCEL`)
				.setLabel('❌ Cancel')
				.setStyle(ButtonStyle.Secondary)
		);

		// Send Message:
		await interaction_startUnassign.reply({
			embeds: [confirmationEmbed],
			components: [confirmationButtons],
            flags: MessageFlags.Ephemeral
		})

		// Await Reply:
		const reply = await interaction_startUnassign.fetchReply();

		// Create a collector for the confirmation response:
		const collector = reply.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60_000, // 1 minute timeout
		});

		// On Response Collection:
		collector.on('collect', async (interaction_ConfirmUnassign) => {

			// Parse Interaction Id Data:
			const confirmInteractionData = interaction_ConfirmUnassign.customId.split(':');
			const confirmInteractionActionId = confirmInteractionData[2];

			// Debug:
			if(global.outputDebug_InDepth) {
				console.log('Confirmation Response Collected:');
				console.log('actionId:', confirmInteractionActionId)
			}

			// Perform Action:
			if (confirmInteractionActionId === 'CONFIRM') {
				// Confirmed - Attempt to leave role:
				const [updateSuccess, sessionData] = await sessionManager.removePlayerFromEventById(interactionEventId, interaction_startUnassign.user.id)

				if (updateSuccess) {
					// Update Success:
					interaction_ConfirmUnassign.reply({
						embeds: [
							new EmbedBuilder()
							.setTitle('👋 Role Removal:')
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
							.setFooter({ text: `This message will be deleted in 15 seconds.`, iconURL: global.client.user.displayAvatarURL() })
						],
						flags: MessageFlags.Ephemeral
					})

				} else {
					// Update Error:
					interaction_ConfirmUnassign.reply({
						embeds: [
							new EmbedBuilder()
							.setTitle('👋 Role Removal:')
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
							.setFooter({ text: `This message will be deleted in 15 seconds.`, iconURL: global.client.user.displayAvatarURL() })
						],
						flags: MessageFlags.Ephemeral
					})
				}
			}
			if (confirmInteractionActionId === 'CANCEL') {
				// Canceled - Attempt to leave role:
				interaction_ConfirmUnassign.reply({
					embeds: [
						new EmbedBuilder()
						.setColor(global.colors.success)
						.setTitle('❌ Canceled')
						.setDescription(` You're still signed up for this event and no changes have been made.`)
						.setFooter({ text: `This message will be deleted in 15 seconds.`, iconURL: global.client.user.displayAvatarURL() })
					],
					flags: MessageFlags.Ephemeral
				})
			}

			// Delete the original confirmation message:
			await interaction_startUnassign.deleteReply().catch((e) => {console.log('ERROR',e)});
			
			// Schedule response message deletion:
			setTimeout(() => {
				interaction_ConfirmUnassign.deleteReply().catch(() => {});
			}, 15_000);
			

		})

		// On Response Collect Timeout:
		collector.on('end', (collected, reason) => {
			if (reason === 'time') {
				reply.edit({
					content: '⏱️ Time expired. Please try again!',
					components: [],
				}).catch(() => {});
			}
		});

	},
};
