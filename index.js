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

// Old - Client Ready:
//client.once('ready', async () => {
//   console.log(`✅ Logged in as ${client.user.tag}`);
//   console.log(`ℹ️ Version: ${botVersion}`);
  
//});

// Register Commands:
async function registerCommands() {
  // Reset Commands:
  // await client.application.commands.set([]);  // This removes all registered commands

  // Set new Commands:
  const commands = [
    new SlashCommandBuilder().setName('joinsession').setDescription('Join a session'),
    new SlashCommandBuilder().setName('leavesession').setDescription('Leave a session'),
    new SlashCommandBuilder().setName('newsession').setDescription('Create a new session'),
    new SlashCommandBuilder().setName('pinggg').setDescription('hmmm...')
  ].map(command => command.toJSON()); // <== convert to JSON


  // Register Commands:
  try {
    await client.application.commands.set(commands);
    console.log(`✅ Commands Registered!`);
  } catch (error) {
    console.error(`❌ Failed to register commands:`, error);
  }
}

// // Command Handler:
// client.on(Events.InteractionCreate, async interaction => {
//     if (!interaction.isChatInputCommand()) return;

//     if (interaction.commandName === 'pinggg') {
//       await interaction.reply('Pong!');
//     }

//     if (interaction.commandName === 'joinsession') {
//       await interaction.reply('Please choose a session:');
//     }

//     if (interaction.commandName === 'leavesession') {
//       await interaction.reply('Left session:');
//     }

//     if (interaction.commandName === 'newsession') {
//       await interaction.reply('Please name the session:');
//     }
//   });

// Login: (via token)
client.login(botToken);

