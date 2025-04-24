const { Client, Events, GatewayIntentBits } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');  // Add this line
const fs = require('fs');
require('dotenv').config();


const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Load Up:
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Reset Commands:
  await client.application.commands.set([]);  // This removes all registered commands

  // Set new Commands:
  const commands = [
    new SlashCommandBuilder().setName('joinsession').setDescription('Join a session'),
    new SlashCommandBuilder().setName('leavesession').setDescription('Leave a session'),
    new SlashCommandBuilder().setName('newsession').setDescription('Create a new session'),
    new SlashCommandBuilder().setName('pinggg').setDescription('hmmm...')
  ].map(command => command.toJSON()); // <== convert to JSON


  await client.application.commands.set(commands);
  console.log(`✅ Commands Registerd!`);
});

// Command Handler:
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'pinggg') {
      await interaction.reply('Pong!');
    }

    if (interaction.commandName === 'joinsession') {
      await interaction.reply('Please choose a session:');
    }
  });

const botToken = process.env['BOT_TOKEN']
client.login(botToken);

