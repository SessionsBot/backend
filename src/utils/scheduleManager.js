
// -------------------------- [ Imports/Variables ] -------------------------- \\
const cron = require('node-cron');
const global = require('./global.js') // Import Global Variables
const guildManager = require('./guildManager.js')
const { db } = require('./firebase.js'); // Import Firebase

let currentDailySchedules = []; // <-- Store node schedules to be replaced each day w/ fresh data

// -------------------------- [ Functions ] -------------------------- \\

const generalDebug = (c) => {if(global.outputDebug_General) console.log(c)}
const inDepthDebug = (c) => {if(global.outputDebug_InDepth) console.log(c)}

// [TO-DO]  
// Create the 'Initializer' scheudle/function that loads all 'session post schedules' once daily
// the Initializer function will read all guilds/session schedules for SIGNUP POST TIME and schedule them with cron accordingly


async function botInitialize() {
    // Runs Daily @12AM - Loads and schedules all other 'Guild Schedules':
    const dailyInitializeShd = cron.schedule('0 59 11 * * *', async (ctx) => {
            generalDebug(`[⏰] Daily Initialzie Ran - ${ctx.triggeredAt.toISOString()}`);
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

    // Get all guilds:
    const guildsRef = db.collection('guilds')
    const guildsSnapshot = await guildsRef.get();
    
    // For each guild:
    guildsSnapshot.forEach(doc => {
       // Get Guild Data:
        const guildData = doc.data();
        const setupCompleted = guildData?.['setupCompleted'];
        const guildSchedules = guildData?.['sessionSchedules'];
        const dailySignupPostTime = guildData?.['sessionSignup']?.['dailySignupPostTime'];

        // Confirm Guild Setup Properly:
        if(!guildData || !setupCompleted || !guildSchedules || !dailySignupPostTime) { // NOT SETUP PROPERLY:
            // Debug:
            generalDebug(`{!} Guild ${doc.id} is not setup properly!`);

        } else { // SETUP PROPERLY:

            // Create Guilds 'Daily Post' Schedule:
            const hours = Number(dailySignupPostTime?.['hours'] ?? 6)
            const minuets = Number(dailySignupPostTime?.['minutes'] ?? 0);
            const timezone = dailySignupPostTime?.['timeZone'] || 'America/Chicago';


            const guildPostSchedule = cron.schedule(`${minuets} ${hours} * * *`, async (ctx) => {
                
                const creationResult = await guildManager.guildSessions(String(doc.id)).createAllUpcomingSessions(guildSchedules);
                if(creationResult.success){
                    generalDebug(`[i] Created Guild(${doc.id}) Schedule - ${ctx.triggeredAt.toISOString()}`);
                }else{
                    generalDebug(`{!} FAILED: Guild(${doc.id}) Schedule - Firebase Errors?`);
                }
            },
            { // schedule options
                timezone: timezone,
                maxExecutions: 1,
                maxRandomDelay: 5000
            }
            );

            // Add Schedule to List:
            currentDailySchedules.push(guildPostSchedule)
        }

    });

}



// -------------------------- [ Exports ] -------------------------- \\
module.exports = {
    botInitialize,
}