// -------------------------- [ Imports/Variables ] -------------------------- \\
import cron from "node-cron";
import global from "./global.js"; // Import Global Variables
import guildManager from "./guildManager.js";
import { db } from "./firebase.js";
import axios from "axios"; // Import Firebase

// Dev Testing
const devTesting = {
    enabled: true,
    guildId: "1379160686629880028",
};

if (devTesting.enabled) console.info("Dev-Testing enabled within scheduleManager.js... please modify settings if this is unexpected.");

let currentDailySchedules = {}; // <-- Store node schedules to be replaced each day w/ fresh data

// -------------------------- [ Functions ] -------------------------- \\

const generalDebug = (c) => {
    if (global.outputDebug_General) console.log(c);
};
const inDepthDebug = (c) => {
    if (global.outputDebug_InDepth) console.log(c);
};

let alreadyInitialized = false;

/** ### Bot Initialization Fn
 * - *Runs on server* **startup**
 * - Loads and schedules existing guild schedules
 * - Creates *"Daily Initialize"* Schedule
*/
async function botInitialize() {
    // Confirm first/only call:
    if (alreadyInitialized)
        return console.log(`[!] botInitialize already called, skipping duplicate initialization!`);
    alreadyInitialized = true;

    // Runs Daily @11:59 PM - Loads and schedules all other 'Guild Schedules':
    const dailyInitializeShd = cron.schedule(
        "0 59 23 * * *",
        async (ctx) => {
            // schedule execution
            generalDebug(`[⏳] Loading All Guild Schedules - ${ctx.triggeredAt.toLocaleString("en-US",{ timeZone: "America/Chicago" })} `);
            await initializeDailySchedules();
        },
        {
            // schedule options
            timezone: "America/Chicago", // Ensures it's CST/CDT
        }
    );

    // Run Initialize on Bot Startup:
    await dailyInitializeShd.execute();
}

/** ### Initialize Daily Schedules fn
 * - *Runs each day at `11:59 PM`
 * - Loads and schedules existing guild schedules
 *     - Schedules a new 'signup panel post' at the guild's specified `Post Time`.
*/
async function initializeDailySchedules() {
    try {
        // Stop and clear all previous schedules
        Object.values(currentDailySchedules).forEach((job) => job.stop());
        currentDailySchedules = {};

        // Get current guilds bot resides:
        let currentClientGuilds = [];
        const fetchedGuilds = await global.client.guilds.fetch();
        fetchedGuilds.forEach((guild) => {
            currentClientGuilds.push(guild.id);
        });

        // Get all guilds in database:
        const guildsRef = db.collection("guilds");
        const guildsSnapshot = await guildsRef.get();

        // For each guild doc:
        guildsSnapshot.forEach((doc) => {
            // Get Guild Data:
            const guildData = doc.data();
            const setupCompleted = guildData?.["setupCompleted"];
            const guildSchedules = guildData?.["sessionSchedules"];
            const dailySignupPostTime =
                guildData?.["sessionSignup"]?.["dailySignupPostTime"];

            // Confirm Bot is in Guild:
            if (!currentClientGuilds.includes(doc.id))
                return generalDebug(
                    `{!} The bot is not in guild ${doc.id}, This guild will not be scheduled or executed!`
                );

            // Confirm Guild Setup Properly:
            if (
                !guildData ||
                !setupCompleted ||
                !guildSchedules ||
                !dailySignupPostTime
            ) {
                // NOT SETUP PROPERLY:
                // Debug:
                generalDebug(`{!} Guild ${doc.id} is not setup properly!`);
            } else {
                // SETUP PROPERLY:
                // Get Guild Schedule Data:
                const hours = Number(dailySignupPostTime?.["hours"] ?? 6);
                const minuets = Number(dailySignupPostTime?.["minutes"] ?? 0);
                const timeZone = guildData?.["timeZone"] || "America/Chicago";

                // Create Guilds 'Daily Post' Schedule:
                const guildPostSchedule = cron.schedule(
                    `${minuets} ${hours} * * *`,
                    async (ctx) => {
                        // Create guild sessions for the day:
                        const sessionCreationResult = await guildManager.guildSessions(String(doc.id)).createDailySessions(guildSchedules, timeZone);
                        if (!sessionCreationResult.success) 
                        return generalDebug(`{!} FAILED: Guild(${doc.id}) Schedule: ${sessionCreationResult.data}`);

                        // Create/Update guild panel for the day:
                        const creationResult = await guildManager.guildPanel(String(doc.id)).createDailySessionsThreadPanel();
                        if (creationResult.success) {
                            generalDebug(`[i] Guild ${doc.id} - Schedule Ran - ${ctx.triggeredAt.toLocaleString("en-US", {timeZone: "America/Chicago"})}`);
                        } else {
                            generalDebug(`{!} FAILED: Guild(${doc.id}) Schedule!`);
                            console.log(creationResult);
                        }
                    },
                    {
                        // schedule options
                        timezone: timeZone,
                        maxExecutions: 1,
                        maxRandomDelay: 5000,
                    }
                );

                // Store reference to guilds posting schedule:
                currentDailySchedules[doc.id] = guildPostSchedule;

                // [TESTING] Run 'dev testing' / guild schedule early:
                if (devTesting.enabled && doc.id == devTesting.guildId) {
                    console.info("RUNNING GUILD SCHEDULE EARLY...");
                    guildPostSchedule.execute();
                }
            }
        });

        // Report Completion
        await axios.post("https://uptime.betterstack.com/api/v1/heartbeat/CReNYEQ9a6PZWdSmW5kR21Lf");
       
    } catch (error) { 
        // Report Schedule's Initialization Failure:
        try { 
            await axios.post("https://uptime.betterstack.com/api/v1/heartbeat/CReNYEQ9a6PZWdSmW5kR21Lf/fail");
        } catch (e) {
            console.log("{!} Failed to log failed schedule heartbeat/monitor...", e);
        }
    }
}




// -------------------------- [ Exports ] -------------------------- \\
export default {
    botInitialize,
};
