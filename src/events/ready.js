import {  Events, ActivityType  } from "discord.js";
import scheduleManager from "../utils/scheduleManager.js";
import global from "../utils/global.js"; // Import Global Variables
import logtail from "../utils/logs/logtail.js";
import guildManager from "../utils/guildManager.js";
import tests from "../utils/tests.js";
import { DateTime } from "luxon";

export default {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		// Assign Fresh Client to Global Variables:
		global.client = client;

		// Get Startup Timestamp:
		const startupTimestamp = DateTime.now().setZone('America/Chicago').toLocaleString(DateTime.DATETIME_SHORT)

		// Startup Debug:
		if(global.outputDebug_General) {
			console.log(`[✅] READY! Logged in as @${client.user.tag}`);
			console.log(`[📈] Status Page: https://stats.uptimerobot.com/3eCOrtiF8H`);
			console.log(`[⏰] Timestamp: ${startupTimestamp}`);
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


		
