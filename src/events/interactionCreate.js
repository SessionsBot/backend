import {  Events, MessageFlags  } from "discord.js";
import logtail from "../utils/logs/logtail.js";

export default {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// Command Interactions:
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				logtail.warn(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				logtail.warn('Command Interaction Error', {error});
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				}
			}
		}

		// Button Interactions:
		if (interaction.isButton()) {
			// Parse interaction.customId data:
			const interactionData = interaction.customId.split(':');
			const interactionCustomId = interactionData[0];

			const button = interaction.client.buttons.get(interactionCustomId);

			// Confirm button:
			if (!button) {
				return;
			}

			try {
				await button.execute(interaction);

			} catch (error) {
				logtail.warn('Button Interaction Error', {error});
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this button!', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: 'There was an error while executing this button!', flags: MessageFlags.Ephemeral });
				}
			}
		}

		// Autocomplete Interactions:
		if (interaction.isAutocomplete()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				return;
			}

			try {
				await command.autocomplete(interaction);
			} catch (error) {
				logtail.warn('Auto-complete Interaction Error', {error});
			}
		}

		// Select Menu Interactions:
		if (interaction.isStringSelectMenu()) {

			if(interaction) return; // DISABLED - NO STAND ALONE SELECT MENU INTERACTIONS
			// ## THE FOLLOWING CODE WILL NOT EXECUTE ##
			// Parse interaction.customId data:
			const interactionData = interaction.customId.split(':');
			const interactionCustomId = interactionData[0];

			const selectMenu = interaction.client.selectMenus.get(interactionCustomId);

			// Confirm select menu::
			if (!selectMenu) {
				return;
			}

			try {
				await selectMenu.execute(interaction);

			} catch (error) {
				logtail.warn('Select Menu Interaction Error', {error});
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this select menu!', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: 'There was an error while executing this select menu!', flags: MessageFlags.Ephemeral });
				}
			}
			// ## THE ABOVE CODE WILL NOT EXECUTE ##
		}
		
	},
};