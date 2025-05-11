const { Events } = require('discord.js');
const addSessionsModule = require('../utils/sessions/todaysSessions.js');

const global = require('../global.js') // Import Global Variables
const sessionScheduleManager = require('../utils/sessions/scheduleSessionCreation.js'); // Import Session Schedule:

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

		// Startup Debug:
		if(global.outputDebug_General) {
			console.log(`[✅] READY! Logged in as @${client.user.tag}`);
			console.log(`[🪪] Client ID: ${client.user.id}`);
			console.log(`[⏰] Timestamp: ${formattedTimestamp}`);
		}

		// Assign Fresh Client to Global Variables:
		global.client = client;

		// Start Session Schedule:
		sessionScheduleManager.startSchedule()
	},
};