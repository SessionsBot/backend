import {  Events, ActivityType  } from "discord.js";
import scheduleManager from "../utils/scheduleManager.js";
import global from "../utils/global.js"; // Import Global Variables
import logtail from "../utils/logs/logtail.js";
import { DateTime } from "luxon";
import tests from "../utils/tests.js";


export default {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		// Assign Fresh Client to Global Variables:
		global.client = client;

		// Get Startup Timestamp:
		const startupTimestamp = DateTime.now().setZone('America/Chicago').toLocaleString(DateTime.DATETIME_SHORT)

		// Log Startup:
		logtail.info('[✅] Bot Startup', { timestamp: startupTimestamp, clientTag: client?.user?.tag, botVersion: global?.botVersion });

		// Set Bot User's Activity:
		client.user.setActivity('🔗 sessionsbot.fyi', { type: ActivityType.Custom });

		// After Startup - Initialize Schedule System::
		setTimeout(async () => {
			await scheduleManager.botInitialize();
			await tests.init()
		}, 1_500);

	},
};
