// ------- [ Variables/Setup: ] -------

require('dotenv').config();
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const botToken = process.env['BOT_TOKEN']

const fs = require('fs');
const path = require('node:path');

const botVersion = '0.0.2b';

// Init Commands:
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// ------- [ Functions: ] -------

// On client ready:
client.once(Events.ClientReady, readyClient => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`ℹ️ Version: ${botVersion}`);
});

// On Command Interaction:
client.on(Events.InteractionCreate, async interaction => {
  // Check if the interaction is a command:
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);
  // Check if the command data exists:
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

  // Execute the command:
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

// Login: (via token)
client.login(botToken);



