// ------- [ Variables/Setup: ] -------

require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const botToken = process.env['BOT_TOKEN'];

const fs = require('fs');
const path = require('node:path');


// ------- [ File Loader Utility: ] -------

const debugFileLoader = false;

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

// ------- [ Initialize Commands: ] -------

client.commands = new Collection();
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

for (const folder of commandFolders) {
	const commandsPath = path.join(__dirname, 'commands', folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

if(debugFileLoader) {console.log(`[✅] Loaded ${client.commands.size} command(s).`);}

// ------- [ Initialize Buttons: ] -------

client.buttons = new Collection();
const buttonFiles = getAllFiles(path.join(__dirname, 'buttons'), '.js');

for (const filePath of buttonFiles) {
	const button = require(filePath);
	if ('data' in button && 'execute' in button) {
		client.buttons.set(button.data.customId, button);
	} else {
		console.log(`[WARNING] The button at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

if(debugFileLoader) {console.log(`[✅] Loaded ${client.buttons.size} button(s).`);}

// ------- [ Initialize Select Menus: ] -------

client.selectMenus = new Collection();
const selectMenuFiles = getAllFiles(path.join(__dirname, 'selectMenus'), '.js');

for (const filePath of selectMenuFiles) {
	const selectMenu = require(filePath);
	if ('data' in selectMenu && 'execute' in selectMenu) {
		client.selectMenus.set(selectMenu.data.customId, selectMenu);
	} else {
		console.log(`[WARNING] The select menu at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

if(debugFileLoader) {console.log(`[✅] Loaded ${client.selectMenus.size} select menu(s).`);}

// ------- [ Initialize Events: ] -------

const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(__dirname, 'events', file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

if(debugFileLoader) {console.log(`[✅] Loaded ${eventFiles.length} event file(s).`);}

// ------- [ Login (via Token): ] -------

client.login(botToken);

// ------- [ KEEP ALIVE! (via Web Service): ] -------

// HTTP server:
const express = require('express');
const app = express();

// Respond:
app.get('/', (req, res) => res.send('Bot is alive!'));

// Initialize:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Keep-alive server running on port ${PORT}`);
});
