const { Events } = require('discord.js');
import chalk from 'chalk';


module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {

		// Get Startup Timestamp:
		const startupTimestamp = new Date(client.readyTimestamp);
		const formattedTimestamp = startupTimestamp.toLocaleString('en-US', {
			timeZone: 'America/Chicago',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});

		console.log(chalk.bold('[✅]', chalk.green('READY!'), `Logged in as`, chalk.blue(`@${client.user.tag}`)) );
		console.log(`[🪪] Client ID: ${client.user.id}`);
		console.log(`[⏰] Timestamp: ${formattedTimestamp}`);
	},
};