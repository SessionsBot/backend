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
		let guildId = 'N_593097033368338435';
		const scheduleId = 'shd_EX0218308213012';
		const scheduleObject = {
			sessionDateDaily: {
				hour: 7,
				minuets: 30,
				timeZone: 'US Chicago'
			},
			roles: [
				{ roleName: 'Event Host', roleCapcity: 1, users: [], roleDescription: 'This is the main cordinator/speaker of the session.' },
				{ roleName: 'Trainer Crew', roleCapcity: 3, users: [], roleDescription: 'This is the crew resposible for training/onboarding new employees.' }
			],
			sessionTitle: 'Training Session',
			sessionUrl: 'https://www.games.roblox.com'
		}

		// After Startup - Delay:
		setTimeout(async () => {

			console.log('[+] Attempting Firebase / Guild Manager Testing:');

			const result = await guildManager.guildConfiguration(guildId).setDailySignupPostTime({hour: 6, minuets: 30, timeZone: 'US Chicago'})
			console.log(result)
	

		}, 2_500);


	},
};
