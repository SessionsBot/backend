const { Events } = require('discord.js');
const addSessionsModule = require('../utils/addSessions.js');

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

		// Startup Debug:
		console.log(`[✅] READY! Logged in as @${client.user.tag}`);
		console.log(`[🪪] Client ID: ${client.user.id}`);
		console.log(`[⏰] Timestamp: ${formattedTimestamp}`);

		// Clear existing sessions:
		console.log(`[🗓️] ATTEMPTING TO CLEAR SESSIONS --> ...`);
		await addSessionsModule.clearExistingSessions();

		// Generate todays sessions:
		console.log(`[🗓️] ATTEMPTING TO GENERATE SESSIONS --> ...`);
		await addSessionsModule.generateTodaysTrainingSessions();

		// Set the bot's status:
		client.user.setPresence({
			activities: [
				{
					name: 'with the code',
					type: 'PLAYING',
				},
			],
			status: 'online',
		});
		console.log(`[🟢] Status: Online`);
	},
};