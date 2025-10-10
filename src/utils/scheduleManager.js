// Imports:
import cron, { nodeCron, schedule } from "node-cron";
import global from "./global.js";
import guildManager from "./guildManager.js";
import { db } from "./firebase.js";
import axios from "axios";
import logtail from "./logs/logtail.js";

const ENVIRONMENT = process.env?.['ENVIRONMENT'];

/** Internal logging endpoint to track sessions schedule initialization globally.
 * @param {boolean} success
*/
const heartbeatUrl = (success) => {return (`https://uptime.betterstack.com/api/v1/heartbeat/CReNYEQ9a6PZWdSmW5kR21Lf` + (!success ? '/fail' : ''))}

/** Boolean representing if onBotStartup() has already been executed. */
let botInitializedAlready = false

/** Object containing the **currently scheduled guild's** for their daily session thread/signup creation.
 * - Indexed by: `guildId`
 * @type {Record<string, import("node-cron").ScheduledTask>}
 */
let currentServerSessionSchedules = {}
function getCurrentServerSessionSchedules() { return currentServerSessionSchedules }

/** ### Bot Initialization Fn
 * - *Runs on server* **startup**
 * - Loads and schedules existing guild schedules
 * - Starts *"Daily Initialization"* Schedule
*/
async function onBotStartup() { try {
    // Check for previous initialization/completion:
    if(botInitializedAlready) throw {errMsg: `[!!] onBotStartup() has already been called and completed.... IGNORING REQUEST TO INITIALIZE AGAIN!`}
    botInitializedAlready = true

    // Start daily initialization/load schedule:
    const dailyInitializeShd = nodeCron.schedule(
        `0 59 23 * * *`, // cron exp
        async (ctx) => { // shd fn:
            // Log
            logtail.info(`[⏳] Loading All Guild Schedules`);
            // Load/Create Schedules for Today:
            await dailyInitialization();
            // Flush Logs
            logtail.flush();
        }, 
        { // shd options
            timezone: 'America/Chicago'
        }
    )

    // Run Immediately on Bot Startup:
    await dailyInitializeShd.execute();

} catch(err) { // error occurred:
    // Log failure
    logtail.error(`[!!] FAILED SCHEDULE INITIALIZATION! - ${err?.errMsg ? err.errMsg : 'see details...'}`, {err})
}}


/** ### Initialize Daily Schedules fn
 * - *Runs each day at `11:59 PM`
 * - Loads and schedules existing guild schedules
 *     - Schedules a new 'signup panel post' at the guild's specified `Post Time`.
*/
async function dailyInitialization() { 
    // Compressed Logs:
    let setupGuilds = []
    let unsetupGuilds = [];

    try {
        // Stop & Destroy Previous Days Schedules:
        Object.values(currentServerSessionSchedules).forEach((shd) => { shd?.stop(); shd?.destroy() })
        currentServerSessionSchedules = {}

        // Fetch Current Guilds the Bot is Within:
        /** @type {{name: string, id:string}[]} */
        let currentClientGuilds = [];
        const clientGuilds = await global.client.guilds.fetch();
        clientGuilds.forEach((guild) => currentClientGuilds.push({name: guild.name, id: guild.id}))

        // Fetch Guilds from Database:
        const dbGuilds = await db.collection('guilds').get()

        // For Each Guild in Database - Schedule After Checks:
        for (const guildDoc of dbGuilds.docs) {
            // Get guild doc data
            /** @type {import("@sessionsbot/api-types").FirebaseGuildDoc} */
            const guildData = guildDoc.data()

            // Confirm SessionsBot is Still Within Guild:
            const clientGuildItem = currentClientGuilds.find((itm) => itm?.id == guildDoc.id)
            if(!clientGuildItem) {
                if(ENVIRONMENT == 'development') continue; // false alarm
                else { logtail.warn(`{!} Bot is not found in guild (${guildDoc.id}), skipping schedule execution!`, {details: 'It possible the system failed to archive this guild previously, checks required.'}); continue; }
            }

            // Check if Guild is Improperly/Not Setup:
            if(!guildData || !guildData?.setupCompleted || !guildData?.sessionSchedules?.length || !guildData?.sessionSignup?.dailySignupPostTime) {
                // NOT SETUP PROPERLY - Log & Return:
                unsetupGuilds.push({name: clientGuildItem?.name, id: clientGuildItem?.id});
                continue;
            }

            // Get Guilds Session Post Time:
            const atHour = guildData?.sessionSignup?.dailySignupPostTime?.hours
            const atMinute = guildData?.sessionSignup?.dailySignupPostTime?.minutes
            const inTimezone = guildData?.timeZone
            if(atMinute == null || atHour == null || inTimezone == null) { logtail.warn(`Schedule FAILED - Invalid Daily Post Time Configuration!`, {actionNeeded: `This server must change their 'dailySignupPostTime'!`, currentConfig: {atHour, atMinute, inTimezone}}); continue; }

            // SETUP - Queue Guilds Sessions Post @ Requested Post Time:
            setupGuilds.push({name: clientGuildItem?.name, id: clientGuildItem?.id})
            await scheduleGuildSessionsPost(guildDoc.id, atHour, atMinute, inTimezone);
        }

        // Report Completion & Debug:
        logtail.info(`[⌛️] Loaded All Guild Schedules!`, {scheduled: setupGuilds, NOT_scheduled: unsetupGuilds});
        if (ENVIRONMENT != 'development') await axios.post(heartbeatUrl(true));

    } catch(err) { // error occurred:
        // Log failure
        logtail.error(`[!!] FAILED DAILY SCHEDULE INITIALIZATION! - ${err?.errMsg ? err.errMsg : 'see details...'}`, {err});
        try { if (ENVIRONMENT != 'development') await axios.post(heartbeatUrl(false)); }
        catch (e) { logtail.warn("{!} Failed to log failed schedule heartbeat/monitor...", {details: e}); }
    }
}


/** ### Schedule a Guilds Daily Sessions Post FOR CURRENT DAY
 * Utility function to schedule a specific **guild's** sessions posts.
 * - Should be re-called if there are session post time changes during the day. (if before new sch time)
 * - This will **OVERWRITE** the guilds existing post schedule for the day if it exists.
 * @param {string} guildId The guild by id to schedule.
 * @param {string|number} atHour The hour of day to post.
 * @param {string|number} atMinute The minuet of hour to post.
 * @param {string} inTimezone The timezone to use for times.
 */
async function scheduleGuildSessionsPost(guildId, atHour, atMinute, inTimezone = 'America/Chicago') { try {
    // Schedule Guilds Daily Sessions Post:
    const guildSchedule = cron.schedule(
        `${atMinute} ${atHour} * * *`, // cron exp
        async (ctx) => { // shd fn
            // Get Fresh/Updated Guild Data from Database:
            const readGuild = await guildManager.guilds(guildId).readGuild()
            if(!readGuild.success){
                // Failed to read guild DURING schedule:
                logtail.warn(`{!!} Failed to read guild during session post execution!`, {readAttempt: readGuild, guildId});
                return null;
            }
            /** @type {import("@sessionsbot/api-types").FirebaseGuildDoc} */
            const guildData = readGuild.data

            // Create Guilds' sessions for the Day:
            const sessionCreationResult = await guildManager.guildSessions(String(guildId)).createDailySessions(guildData?.sessionSchedules, inTimezone);
            if (!sessionCreationResult.success) {
                return logtail.warn(`{!} Failed ${guildId} during session creation process!`, sessionCreationResult);
            }

            // If no Sessions Scheduled for Today:
            if (sessionCreationResult.emptyDay){
                return logtail.info(`[i] Guild ${guildId} - Schedule Ran - NO SCHEDULES TODAY - ${ctx.triggeredAt.toLocaleString("en-US", {timeZone: "America/Chicago"})}`); 
            }

            // Create/Update Guild Panel for the Day:
            const creationResult = await guildManager.guildPanel(String(guildId)).createDailySessionsThreadPanel();
            if (creationResult.success) {
                logtail.info(`[i] Guild ${guildId} - Schedule Ran - ${ctx.triggeredAt.toLocaleString("en-US", {timeZone: "America/Chicago"})}`); 
            } else {
                logtail.warn(`{!} FAILED: Guild(${guildId}) Schedule!`, {creationResult});
                
            }

        },
        { // shd options
            timezone: inTimezone,
            maxExecutions: 1,
            maxRandomDelay: 5000
        }
    )

    // Check/Overwrite Any Existing Schedule:
    const existing = currentServerSessionSchedules?.[guildId]
    if(existing){ existing.stop(); existing.destroy(); }

    // Add to All Schedules List:
    currentServerSessionSchedules[guildId] = guildSchedule;

} catch(err) { // error occurred:
    // Log schedule creation failure:
    logtail.warn(`{!} Failed to schedule guild (${guildId}) for daily sessions post!`)
    return null
}}


/** ### Cancels & Destroys a Guilds Daily Sessions Post Schedule FOR CURRENT DAY
 * @param {string} guildId The guild by id to remove from schedule queue.
*/
async function cancelGuildSessionsPost(guildId) {
    const currentSchedule = currentServerSessionSchedules?.[guildId] || null;
    if(!currentSchedule) return {success: false, message: `Could not find that guild in current schedule queue to remove/destroy. - ${guildId}`}
    else{
        currentSchedule.stop();
        currentSchedule.destroy();
        return {success: true, message: `Successfully un-scheduled guild's sessions posts - ${guildId}`}
    }
}

// Exports:
export default {
    onBotStartup,
    scheduleGuildSessionsPost,
    cancelGuildSessionsPost,
    getCurrentServerSessionSchedules
}