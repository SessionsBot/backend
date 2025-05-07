const { Events } = require('discord.js');
const addSessionsModule = require('../utils/sessions/todaysSessions.js');

const global = require('../global.js') // Import Global Variables

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {

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

		// Modify Sessions - Clear All & Create New:
		async function modifySessions() {
			// Clear existing sessions:
			await addSessionsModule.clearExistingSessions();
			// Wait for 1 second:
			await new Promise(resolve => setTimeout(resolve, 1000));
			// Generate todays sessions:
			await addSessionsModule.generateTodaysTrainingSessions(client);
		}
		await modifySessions()

		// Startup Debug:
		if(global.outputDebug_General) {
			console.log(`[✅] READY! Logged in as @${client.user.tag}`);
			console.log(`[🪪] Client ID: ${client.user.id}`);
			console.log(`[⏰] Timestamp: ${formattedTimestamp}`);
		}

		// Assign Fresh Client to Global Variables:
		global.client = client;
	},
};