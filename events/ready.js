const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		console.log(`Client ID: ${client.user.id}`);
		console.log(`Timestamp: ${client.readyTimestamp}`);
	},
};