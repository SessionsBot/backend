// ------- [ Variables: ] -------

const { Client, Events, GatewayIntentBits } = require('discord.js');

require('dotenv').config();
const botToken = process.env['BOT_TOKEN']

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const { SlashCommandBuilder } = require('@discordjs/builders');  // Add this line

const fs = require('fs');

const botVersion = '0.0.2b';

// ------- [ Functions: ] -------

// On client ready:
client.once(Events.ClientReady, readyClient => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`ℹ️ Version: ${botVersion}`);
});

// Login: (via token)
client.login(botToken);



