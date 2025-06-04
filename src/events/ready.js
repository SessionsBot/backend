const { Events, ActivityType } = require('discord.js');

const global = require('../utils/global.js') // Import Global Variables
const sessionScheduleManager = require('../utils/sessions/sessionScheduler.js'); // Import Session Schedule:

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

		// Start Session Schedule:
		sessionScheduleManager.startSchedule()

		// [ GUILD MANAGER TESTING ] \\
		const guildManager = require('../utils/guildManager.js')
		let guildId = '1379160686629880028';
		const scheduleId = 'shd_0218308213012';
		const scheduleObject = {
			sessionDateDaily: {
				hour: 6,
				minuets: 30,
				timeZone: 'US Chicago'
			},
			roles: [
				{ roleName: 'Role Name', roleCapcity: 1, users: [], roleDescription: 'This is an example role description.' },
				{ roleName: 'Role2 Name', roleCapcity: 3, users: [], roleDescription: 'This is an example role description.' }
			],
			sessionTitle: 'Title Example',
			sessionUrl: 'https://www.games.roblox.com'
		}



		// Test:
		setTimeout(() => {
			console.log('[+] Attempting Firebase / Guild Manager Testing:')

			
		}, 2_500);


	},
};