// ------- [ Variables/Setup: ] -------

require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const botToken = process.env['BOT_TOKEN'];

const fs = require('fs');
const path = require('node:path');


// ------- [ File Loader Utility: ] -------

const debugFileLoader = true;

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
const commandFiles = getAllFiles(path.join(__dirname, 'src', 'commands'), '.js');

for (const filePath of commandFiles) {
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

if(debugFileLoader) {console.log(`[✅] Loaded ${client.commands.size} command(s).`);}

// ------- [ Initialize Buttons: ] -------

client.buttons = new Collection();
const buttonFiles = getAllFiles(path.join(__dirname, 'src', 'buttons'), '.js');

for (const filePath of buttonFiles) {
	const button = require(filePath);
	if ('data' in button && 'execute' in button) {
		client.buttons.set(button.data.customId, button);
	} else {
		console.log(`[WARNING] The button at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

if(debugFileLoader) {console.log(`[✅] Loaded ${client.buttons.size} button(s).`);}

// ------- [ Initialize Select Menus: (DISABLED) ] -------
// { ... }

// ------- [ Initialize Events: ] -------

const eventFiles = fs.readdirSync(path.join(__dirname, 'src', 'events')).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(__dirname, 'src', 'events', file);
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

// ------- [ Web Service (prevents inactivity): ] -------

require('./src/webService.js')