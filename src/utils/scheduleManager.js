// -------------------------- [ Imports/Variables ] -------------------------- \\
import cron, { schedule } from "node-cron";
import global from "./global.js"; // Import Global Variables
import guildManager from "./guildManager.js";
import { db } from "./firebase.js";
import axios from "axios"; // Import Firebase
import logtail from "./logs/logtail.js";

// Dev Testing
const ENVIRONMENT = process.env['ENVIRONMENT'];
const devTesting = {
    enabled: false,
    guildId: "1379160686629880028",
};

// Logging
const log = logtail


if (devTesting.enabled) console.info("Dev-Testing enabled within scheduleManager.js... please modify settings if this is unexpected.");

/** Object containing the **currently scheduled guild's** for their daily session thread/signup creation.
 * - Indexed by: `guildId`
 * @type { Record<string, import("node-cron").ScheduledTask> }
 */
let currentDayGuildSchedules = {}; // <-- Store node schedules to be replaced each day w/ fresh data

// -------------------------- [ Functions ] -------------------------- \\

let alreadyInitialized = false;

/** ### Bot Initialization Fn
 * - *Runs on server* **startup**
 * - Loads and schedules existing guild schedules
 * - Creates *"Daily Initialize"* Schedule
*/
async function botInitialize() {
    // Confirm first/only call:
    if (alreadyInitialized)
        return logtail.warn(`[!] botInitialize already called, skipping duplicate initialization!`);
    alreadyInitialized = true;

    // Runs Daily @11:59 PM - Loads and schedules all other 'Guild Schedules':
    const dailyInitializeShd = cron.schedule(
        "0 59 23 * * *",
        async (ctx) => {
            // schedule execution
            logtail.info(`[⏳] Loading All Guild Schedules`);
            await initializeDailySchedules();
            logtail.flush();
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
    // Compressed Logs:
    const setupGuilds = [];
    const unsetupGuilds = [];
    try {
        // Stop and clear all previous schedules
        Object.values(currentDayGuildSchedules).forEach((job) => job.stop());
        currentDayGuildSchedules = {};

        // Get current guilds bot resides:
        let currentClientGuilds = [];
        const fetchedGuilds = await global.client.guilds.fetch();
        fetchedGuilds.forEach((guild) => {
            currentClientGuilds.push({
                id: guild.id,
                name: guild.name,
            });
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
            const dailySignupPostTime = guildData?.["sessionSignup"]?.["dailySignupPostTime"];
            const clientGuildInfo = currentClientGuilds.find((itm) => itm.id == doc.id);

            // Confirm Bot is in Guild:
            if (!clientGuildInfo) { 
                if(ENVIRONMENT == 'development') return;
                 log.warn(
                    `{!} Bot is not in guild? (${doc.id}), skipping execution!`, 
                    {details: 'It possible the system failed to archive this guild previously, checks required.'}
                )
                return
            }

            // Confirm Guild Setup Properly:
            if (!guildData || !setupCompleted || !guildSchedules || !dailySignupPostTime) {
                // NOT SETUP PROPERLY - Log & Return:
                unsetupGuilds.push({name: clientGuildInfo?.name, id: clientGuildInfo?.id})
                return
            } else {
                // SETUP PROPERLY - Schedule Signup Post:
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
                        if (!sessionCreationResult.success) {
                            log.warn(`{!} Failed ${doc.id} during session creation process!`, sessionCreationResult);
                            return
                        }

                        // If no sessions scheduled for today:
                        if (sessionCreationResult.emptyDay){
                            return log.info(`[i] Guild ${doc.id} - Schedule Ran - NO SCHEDULES TODAY - ${ctx.triggeredAt.toLocaleString("en-US", {timeZone: "America/Chicago"})}`); 
                        }

                        // Create/Update guild panel for the day:
                        const creationResult = await guildManager.guildPanel(String(doc.id)).createDailySessionsThreadPanel();
                        if (creationResult.success) {
                            log.info(`[i] Guild ${doc.id} - Schedule Ran - ${ctx.triggeredAt.toLocaleString("en-US", {timeZone: "America/Chicago"})}`); 
                        } else {
                            log.warn(`{!} FAILED: Guild(${doc.id}) Schedule!`, {creationResult});
                            
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
                currentDayGuildSchedules[doc.id] = guildPostSchedule;
                setupGuilds.push({name: clientGuildInfo?.name, id: clientGuildInfo?.id})

                // [DEV - ENVIRONMENT] Run 'dev testing' / guild schedule early:
                if (ENVIRONMENT == 'development' && devTesting.enabled && doc.id == devTesting.guildId) {
                    logtail.info("[🛠️] RUNNING GUILD SCHEDULE EARLY...");
                    guildPostSchedule.execute();
                    guildPostSchedule.destroy();
                }
            }
        });

        // Report Completion & Debug:
        logtail.info(`[⌛️] Loaded All Guild Schedules!`, {scheduled: setupGuilds, NOT_scheduled: unsetupGuilds});
        if (ENVIRONMENT != 'development') await axios.post("https://uptime.betterstack.com/api/v1/heartbeat/CReNYEQ9a6PZWdSmW5kR21Lf");
       
    } catch (error) { 
        // Report Schedule's Initialization Failure:
        logtail.error(`[!] CRITICAL | Failed to initialize scheduling system! Bot restart required...`, {details: error})
        try { 
            if (ENVIRONMENT != 'development') await axios.post("https://uptime.betterstack.com/api/v1/heartbeat/CReNYEQ9a6PZWdSmW5kR21Lf/fail");
        } catch (e) {
            logtail.warn("{!} Failed to log failed schedule heartbeat/monitor...", {details: e});
        }
    }
}




// -------------------------- [ Exports ] -------------------------- \\
export default {
    botInitialize,
    currentDayGuildSchedules
};
