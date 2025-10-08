// ------- [ Variables/Setup: ] -------
import 'dotenv/config'
import dotenv from "dotenv";
import { fileURLToPath, pathToFileURL } from "node:url";
import {  Client, Collection, GatewayIntentBits  } from "discord.js";
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
import global from "./src/utils/global.js";
const BOT_TOKEN = process.env['BOT_TOKEN'];
const DEV_BOT_TOKEN = process.env['DEV_BOT_TOKEN'];

import fs from "fs";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------- [ File Loader Utility: ] -------

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
	const { default: command } = await import(pathToFileURL(filePath).href);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


// ------- [ Initialize Buttons: ] -------

client.buttons = new Collection();
const buttonFiles = getAllFiles(path.join(__dirname, 'src', 'buttons'), '.js');

for (const filePath of buttonFiles) {
	const { default: button } = await import(pathToFileURL(filePath).href);
	if ('data' in button && 'execute' in button) {
		client.buttons.set(button.data.customId, button);
	} else {
		console.log(`[WARNING] The button at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


// ------- [ Initialize Events: ] -------

const eventFiles = fs.readdirSync(path.join(__dirname, 'src', 'events')).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(__dirname, 'src', 'events', file);
	const { default: event } = await import(pathToFileURL(filePath).href);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}


// ------- [ DEBUG - File Loader Utility: ] -------

const debugFileLoader = global.outputDebug_InDepth // true;

if(debugFileLoader) {
	console.log(`[✅] Loaded ${client.commands.size} command(s).`);
	console.log(`[✅] Loaded ${client.buttons.size} button(s).`);
	console.log(`[✅] Loaded ${eventFiles.length} event file(s).`);
}


// ------- [ Login (via Token): ] -------

if(process.env['ENVIRONMENT'] == 'development') {
	client.login(DEV_BOT_TOKEN);
} else {
	client.login(BOT_TOKEN);
}


// ------- [ Web Service (prevents inactivity): ] -------

import './src/webService/webService.js';