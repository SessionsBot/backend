const { Events, ActivityType } = require('discord.js');
const guildManager = require('../utils/guildManager.js')
const scheduleManager = require('../utils/scheduleManager.js')
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
		const guildId = '593097033368338435';

		const singupPostConfig = {
			hours: 5,
			minutes: 30,
			timeZone: 'America/Chicago'
		}

		const EXAMPLE_scheduleObject = {
			sessionDateDaily: {
				hours: 10,
				minutes: 30,
				timeZone: 'America/Chicago'
			},
			roles: [
				{ roleName: 'Event Host', roleEmoji: '🎙️', roleCapacity: 1, users: [], roleDescription: 'This is main speaker/cordinator of the session. Max of 1.' },
				{ roleName: 'Training Crew', roleEmoji: '🤝', roleCapacity: 3, users: [], roleDescription: 'This is the crew responsible for training new employees.' }
			],
			sessionTitle: 'Training Session',
			sessionUrl: 'https://www.roblox.com/games/407106466/Munch-V1'
		}

		

		// After Startup - Delay:
		setTimeout(async () => {

			// Initialize Schedule System:
			await scheduleManager.botInitialize()


			console.log('[i] Testing Completed');

		}, 1_500);


	},
};


		
