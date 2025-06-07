const { Events, ActivityType } = require('discord.js');
const guildManager = require('../utils/guildManager.js')
const scheduleManager = require('../../private/scheduleManager.js')
const global = require('../utils/global.js') // Import Global Variables

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		// Assign Fresh Client to Global Variables:
		global.client = client;

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
			console.log(`[📈] Status Page: https://stats.uptimerobot.com/3eCOrtiF8H`);
			console.log(`[⏰] Timestamp: ${formattedTimestamp}`);
		}

		// Set Bot User's Activity:
		client.user.setActivity('📅 Training Sessions', { type: ActivityType.Watching });




		// [ GUILD MANAGER TESTING ] \\

		

		// After Startup - Delay:
		setTimeout(async () => {

			console.log('[+] Attempting Firebase / Guild Manager Testing:');
			
			const guildId = '1379160686629880028';

			// Initialize Schedule System:
			await scheduleManager.dailyInitialize()

			const result = await guildManager.guildSessions(guildId).createSession(guildManager.EXAMPLE_scheduleObject)
			console.log(result)
			
			setTimeout(() => {
				guildManager.guildSessions(guildId).updateSessionSignup()
			}, 2000);

			console.log('[i] Testing Completed');

		}, 1_500);


	},
};


		
