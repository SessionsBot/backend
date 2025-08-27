import {  Events, ActivityType, Collection  } from "discord.js";
import guildManager from "../utils/guildManager.js";
import scheduleManager from "../utils/scheduleManager.js";
import global from "../utils/global.js"; // Import Global Variables
import logtail from "../utils/logs/logtail.js";
import guildCreate from "./guildCreate.js";

export default {
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
		logtail.info(' [✅] Bot Startup', { clientTag: client?.user?.tag, botVersion: global?.botVersion });

		// Set Bot User's Activity:
		client.user.setActivity('🔗 sessionsbot.fyi', { type: ActivityType.Custom });

		// After Startup - Initialize Schedule System::
		setTimeout(async () => {
			await scheduleManager.botInitialize()
		}, 1_500);

	},
};


		
