const { Events, ActivityType, Collection } = require('discord.js');
const guildManager = require('../utils/guildManager.js')
const scheduleManager = require('../utils/scheduleManager.js')
const global = require('../utils/global.js'); // Import Global Variables
const logtail  = require('../utils/logtail.ts');

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

		// Testing logtail:
		logtail.info(' [✅] Bot Startup', { clientTag: client?.user?.tag });

		// Set Bot User's Activity:
		client.user.setActivity('📅 Training Sessions', { type: ActivityType.Watching });

		// After Startup - Initialize Schedule System::
		setTimeout(async () => {
			await scheduleManager.botInitialize()
		}, 1_500);


	},
};


		
