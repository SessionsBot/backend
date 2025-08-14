const { Events, ActivityType, Collection } = require('discord.js');
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

		
		// ! TESTING:
		/*

		const guildId = '593097033368338435';
		let example_guildSchedule = {
			sessionTitle: 'Training Session',
			sessionUrl: 'https://www.roblox.com',
			sessionDateDaily: {
				hours: 12,
				minutes: 30,
			},
			roles: [
				{
					roleName: 'Event Host', 
					roleDescription: 'This is main speaker/cordinator of the session.',
					roleEmoji: '🎙️',
					roleCapacity: 1,
					users: []
				},
				{
					roleName: 'Trainers', 
					roleDescription: 'This is crew responsible for training new employees.',
					roleEmoji: '🤝',
					roleCapacity: 3,
					users: []
				},
			]
		}

		let guildSchedules = [];
		const times = [8, 10, 14, 17, 20]
		for(let time of times){
			// Deep clone the schedule object
			let scheduleCopy = JSON.parse(JSON.stringify(example_guildSchedule));
			scheduleCopy.sessionDateDaily.hours = time;
			guildSchedules.push(scheduleCopy);
		}

		// Setup Guild
		const result = await guildManager.guildConfiguration(guildId).configureGuild({
			accentColor: '0x9b42f5', 
			timeZone: 'America/Chicago', 
			adminRoleIds: [], 
			dailySignupPostTime: {
				hours: 6,
				minutes:0
			},
			signupMentionIds: [], 
			allGuildSchedules: guildSchedules, 
			panelChannelId: '1141397279882887301'
		})

		console.log(result)

		*/ 


		// After Startup - Initialize Schedule System::
		setTimeout(async () => {
			await scheduleManager.botInitialize()
		}, 1_500);


	},
};


		
