// -------------------------- [ Imports/Variables ] -------------------------- \\
const cron = require('node-cron');
const global = require('./global.js') // Import Global Variables
const guildManager = require('./guildManager.js')
const { db } = require('./firebase.js'); // Import Firebase

let currentDailySchedules = []; // <-- Store node schedules to be replaced each day w/ fresh data

// -------------------------- [ Functions ] -------------------------- \\

const generalDebug = (c) => {if(global.outputDebug_General) console.log(c)}
const inDepthDebug = (c) => {if(global.outputDebug_InDepth) console.log(c)}


// Bot Initialization Fn:
async function botInitialize() {
    // Runs Daily @11:59 PM - Loads and schedules all other 'Guild Schedules':
    const dailyInitializeShd = cron.schedule('0 59 23 * * *', async (ctx) => {
            generalDebug(`[⏰] Loading All Guild Schedules - ${ ctx.triggeredAt.toLocaleString('en-US', {timeZone: 'America/Chicago'}) } `);
            await dailyInitializeFn();
        },
        { // schedule options
            timezone: 'America/Chicago' // Ensures it's CST/CDT
        }
    );

    // Run Initialize on Bot Startup:
    await dailyInitializeShd.execute()
}


// Daily Initialization Fn:
async function dailyInitializeFn() {

    // Get current client guilds:
    let currentClientGuilds = [];
    const fetchedGuilds = await global.client.guilds.fetch();
    fetchedGuilds.forEach(guild => {currentClientGuilds.push(guild.id)});


    // Get all guilds in database:
    const guildsRef = db.collection('guilds')
    const guildsSnapshot = await guildsRef.get();
    
    // For each guild doc:
    guildsSnapshot.forEach(doc => {
       // Get Guild Data:
        const guildData = doc.data();
        const setupCompleted = guildData?.['setupCompleted'];
        const guildSchedules = guildData?.['sessionSchedules'];
        const dailySignupPostTime = guildData?.['sessionSignup']?.['dailySignupPostTime'];

        // Confirm Bot is in Guild:
        if(!currentClientGuilds.includes(doc.id)) return generalDebug(`{!} The bot is not in guild ${doc.id}, This guild will not be scheduled or excecuted!`)

        // Confirm Guild Setup Properly:
        if(!guildData || !setupCompleted || !guildSchedules || !dailySignupPostTime) { // NOT SETUP PROPERLY:
            // Debug:
            generalDebug(`{!} Guild ${doc.id} is not setup properly!`);

        } else { // SETUP PROPERLY:
            // Get Guild Schedule Data:
            const hours = Number(dailySignupPostTime?.['hours'] ?? 6)
            const minuets = Number(dailySignupPostTime?.['minutes'] ?? 0);
            const timeZone = guildData?.['timeZone'] || 'America/Chicago';

            // Create Guilds 'Daily Post' Schedule:
            const guildPostSchedule = cron.schedule(`${minuets} ${hours} * * *`, async (ctx) => {
                
                // Create guild sessions for the day:
                const sessionCreationResult = await guildManager.guildSessions(String(doc.id)).createDailySessions(guildSchedules, timeZone)
                if(!sessionCreationResult.success) return generalDebug(`{!} FAILED: Guild(${doc.id}) Schedule: ${sessionCreationResult.data}`);

                // Create/Update guild panel for the day:
                const creationResult = await guildManager.guildPanel(String(doc.id)).createDailySessionsThreadPanel()
                if(creationResult.success){
                    generalDebug(`[i] Guild ${doc.id} - Schedule Ran - ${ ctx.triggeredAt.toLocaleString('en-US', {timeZone: 'America/Chicago'}) }`);
                }else{
                    generalDebug(`{!} FAILED: Guild(${doc.id}) Schedule!`);
                    console.log(creationResult)
                }
            },
            { // schedule options
                timezone: timeZone,
                maxExecutions: 1,
                maxRandomDelay: 5000
            });


            // ! DELETE LATER:
            // If 'Development' Guild:
            // const testingGuilds = [
            //     // '1379160686629880028'
            // ]
            // if(testingGuilds.includes(doc.id)){
            //     // Run Schedule early for Guild:
            //     console.log('--------------------------------')
            //     console.log('[*] Making Exception for Guild:')
            //     guildPostSchedule.execute()
            //     console.log(`[*] Schedule Ran! (${doc.id})`)
            //     console.log('--------------------------------')
            // }else{
            //     // Add Schedule to Storage List (currently no purpose):
            //     currentDailySchedules.push(guildPostSchedule)
            // }

            
        }
    });

}



// -------------------------- [ Exports ] -------------------------- \\
module.exports = {
    botInitialize,
}