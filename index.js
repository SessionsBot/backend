// ------- [ Variables/Setup: ] -------

const chalk = require('chalk');

require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const botToken = process.env['BOT_TOKEN']

const fs = require('fs');
const path = require('node:path');

const botVersion = '0.0.2b';

// ------- [ Initialize Commands: ] -------

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

// ------- [ Initialize Buttons: ] -------

client.buttons = new Collection();

function getAllFiles(dir, ext, fileList = []) {
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			getAllFiles(filePath, ext, fileList); // Recurse into subfolder
		} else if (file.endsWith(ext)) {
			fileList.push(filePath);
		}
	}
	return fileList;
}

const buttonsPath = path.join(__dirname, 'buttons');
const buttonFiles = getAllFiles(buttonsPath, '.js');

for (const filePath of buttonFiles) {
	const button = require(filePath);
	if ('data' in button && 'execute' in button) {
		client.buttons.set(button.data.customId, button);
	} else {
		console.log(`[WARNING] The button at ${filePath} is missing a required "data" or "execute" property.`);
	}
}



// ------- [ Initialize Events: ] -------

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// ------- [ Login (via Token): ] -------

client.login(botToken);



