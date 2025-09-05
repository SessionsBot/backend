import {  Events, ActivityType  } from "discord.js";
import scheduleManager from "../utils/scheduleManager.js";
import global from "../utils/global.js"; // Import Global Variables
import logtail from "../utils/logs/logtail.js";
import { DateTime } from "luxon";
import { sendPermsDeniedAlert } from "../utils/responses/permissionDenied.js";

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
			console.log(`[📈] Status Page: https://status.sessionsbot.fyi`);
			console.log(`[⏰] Timestamp: ${startupTimestamp}`);
		}

		// Log Startup:
		logtail.info(' [✅] Bot Startup', { clientTag: client?.user?.tag, botVersion: global?.botVersion });

		// Set Bot User's Activity:
		client.user.setActivity('🔗 sessionsbot.fyi', { type: ActivityType.Custom });

		// After Startup - Initialize Schedule System::
		setTimeout(async () => {
			await scheduleManager.botInitialize();
		}, 1_500);

	},
};


		
