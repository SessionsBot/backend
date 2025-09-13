//------------------------------------------[ Imports ]------------------------------------------\\
import express from "express";
const router = express.Router({mergeParams: true})
import responder from "../../utils/responder.js";
import {  HttpStatusCode  } from "axios";
import guildManager from "../../../../../utils/guildManager.js";
import {  checkIfUserInGuild  } from "../../utils/checkGuildMember.js";
import verifyToken from "../../utils/verifyToken.js";
import verifyGuildMember from "../../utils/verifyGuildMember.js";
import verifyGuildAdmin from "../../utils/verifyGuildAdmin.js";
import global from "../../../../../utils/global.js";


//-----------------------------------------[ Endpoints ]-----------------------------------------\\
// Root Call:
router.get('/', (req, res) => {
    return responder.errored(res, 'Please provide a valid endpoint', HttpStatusCode.MultipleChoices)
})

// ------ { Guild Sessions } ------

// GET/FETCH Session:
router.get('/:sessionId', verifyToken, verifyGuildMember, async (req, res) => { try {
    // 1. Get parameters:
    const sessionId = req.params?.sessionId
    const guildId = req.params?.guildId
    // 2. Confirm parameters:
    if(!sessionId) throw {message: `Invalid Input - Missing 'sessionId'`, code: 400};
    if(!guildId) throw {message: `Invalid Input - Missing 'guildId'`, code: 400};
    // 3. Get/Read Session:
    const readAllResults = await guildManager.guildSessions(guildId).getSessions()
    if(!readAllResults.success) throw {message: `Internal Error - Failed to fetch guild sessions for guild(${guildId}).`, code: 500};
    const allSessions = readAllResults.data;
    const reqSession = allSessions[sessionId];
    if(!reqSession) throw {message: `Not Found - Cannot find session(${sessionId}) in guild(${guildId}).`, code: 404};
    
    // 4. Return results:
    return responder.succeeded(res, reqSession)
    
} catch (err) {

    if(err?.message){ // Known Error:
        return responder.errored(res, err.message, err?.code || 400)
    }else{ // Unknown Error:
        return responder.errored(res, 'An internal API error has occurred, please try again.', 500)
    }
    
}})


// PATCH/UPDATE Run Post Schedule Early:
router.patch('/post-early', verifyToken, verifyGuildAdmin, async (req, res) => {
    // Get req data:
    const guildId = req.params?.guildId;
    if(!guildId) return responder.errored(res, `Invalid Input - Missing required 'guildId'.`, 400)
    // Attempt to post / run daily schedule for guild early:
    try { 
        // Get Guild Data:
        const guildDataAttempt = await guildManager.guilds(guildId).readGuild()
        if(!guildDataAttempt?.success) return responder.errored(res, `Failed to read guild data for guild(${guildId}).`, 500);
        
        const guildData = guildDataAttempt.data
        const setupCompleted = guildData?.["setupCompleted"];
        const guildSchedules = guildData?.["sessionSchedules"];
        const dailySignupPostTime = guildData?.["sessionSignup"]?.["dailySignupPostTime"];
        const timeZone = guildData?.["timeZone"] || "America/Chicago";

        // Confirm Guild Setup Properly:
        if (!guildData || !setupCompleted || !guildSchedules || !dailySignupPostTime) return responder.errored(res, `Failed to post sessions - Guild is not setup properly! (${guildId})`, 400);

        // Create guild sessions for the day:
        const sessionsCreationAttempt = await guildManager.guildSessions(guildId).createDailySessions(guildSchedules, timeZone);
        if (!sessionsCreationAttempt.success) return responder.errored(res, `Failed to create sessions for guild(${guildId})! Please try again.`, 500);

        // Create/Update guild panel for the day:
        const panelThreadCreationAttempt = await guildManager.guildPanel(guildId).createDailySessionsThreadPanel();
        if (!panelThreadCreationAttempt.success) return responder(res, `Failed to create signup panel/thread for guild(${guildId})! Please try again.`, 500);

        // If all processes succeeded - Return Success:
        return responder.succeeded(res, `Successfully posted guild sessions schedules early for guild(${guildId})!`);

    }catch(e){
        // Error Occurred - Return Errored Response:
        console.warn(`{!}[API Call] Failed to post sessions early for guild: ${guildId}:`, e)
        responder.errored(res, `Failed to post sessions early for guild(${guildId})!`, 500);
    }
})

// DELETE/REMOVE All Signup/Session Panel Threads:
// - ! Disabled !
let busyForGuilds = new Set()
const deleteAllThreads = async (guildId, threads) => {
    // Check for previous deletion req:
    if(busyForGuilds.has(guildId)) return console.warn(`{!} Ignoring thread deletion req... Already processing previous req.`);
    busyForGuilds.add(guildId)
    // Delay helper fn:
    function delay(ms){ return new Promise(resolve => setTimeout(resolve, ms)) }
    // Attempt to delete:
    for (const thread of threads.values()) {
        // console.log('Deleting Thread:', thread?.name || thread?.id,)
        await thread.delete();
        await delay(750); // Wait 1500ms before next deletion
    }
    // Remove guild from busy list:
    busyForGuilds.delete(guildId)
}
router.delete('/signup-threads', verifyToken, verifyGuildAdmin, async (req, res) => {try{
    return responder.errored(res, 'This endpoint is currently out of service, check back later...', 423)
    // Get guild id/data from req:
    const guildId = req.params?.guildId;
    if(!guildId) return responder.errored(res, `Invalid Input - Missing required 'guildId'.`, 400)
    const guildDataAttempt = await guildManager.guilds(guildId).readGuild()
    if(!guildDataAttempt.success) return responder.errored(res, `Internal Error/Bad Request - Failed to read guild data.`, 500);
    const guildData = guildDataAttempt.data
    
    // Get guild 'signup channel' for thread deletion:
    const signupChannelId = guildData?.sessionSignup?.panelChannelId
    if(!signupChannelId) return responder.errored(res, `Internal Error/Bad Request - Failed to get panel/signup channel id.`, 500);
    // Load signup channel with bot client
    const fetchedChanel = await global.client.channels.fetch(signupChannelId);
    if(!fetchedChanel) return responder.errored(res, `Internal Error/Bad Request - Failed to fetch panel/signup channel.`, 500);

    // CONTINUE HERE - Deleting fetched threads...
    /** @type {import("discord.js").FetchedThreadsMore} */
    const threads = await fetchedChanel.threads.fetch({archived: {limit: 25}});
    if(!threads) return responder.errored(res, `Internal Error/Bad Request - Failed to fetch any threads from signup channel`, 500)

    deleteAllThreads(guildId, threads?.threads);

    // Return success:
    return responder.succeeded(res, {message: 'Deletion process has started...', inDeleteQueue: threads?.threads});


}catch(e){ // Error occurred
    const guildId = req.params?.guildId;
    console.warn(`Failed to delete signup threads for guild(${guildId}):`, e);
}})


// ------ { Session Roles } ------


// PATCH/UPDATE Session Role - Add User to Role:
router.patch('/:sessionId/roles', verifyToken, verifyGuildAdmin, async (req, res) => { try {
    // 1. Get parameters:
    const sessionId = req.params?.sessionId
    const guildId = req.params?.guildId
    const roleName = req.body?.roleName
    const userId = req.body?.userId

    // 2. Confirm parameters:
    if(!sessionId) throw {message: `Invalid Input - Missing 'sessionId'`, code: 400};
    if(!guildId) throw {message: `Invalid Input - Missing 'guildId'`, code: 400};
    if(!roleName) throw {message: `Invalid Input - Missing 'roleName' inside body of request.`, code: 400};
    if(!userId) throw {message: `Invalid Input - Missing 'userId' inside body of request.`, code: 400};

    // 3. Validate Body:
    const fetchAllSessions = await guildManager.guildSessions(guildId).getSessions()
    if(!fetchAllSessions.success) throw {message: `Internal Error - Failed to fetch guild sessions for guild(${guildId}).`, code: 500};
    /** @type {import('@sessionsbot/api-types').UpcomingSession} */
    const reqSession = fetchAllSessions?.data?.[sessionId];
    // Verify Session Exists:
    if(!reqSession) throw {message: `Not Found - Cannot find session(${sessionId}) in guild(${guildId}).`, code: 404};
    const reqRoleIndex = reqSession?.roles.findIndex((role) => role.roleName === roleName)
    // Verify Role Exists:
    if(reqRoleIndex == -1) throw {message: `Not Found - Cannot find role "${roleName}" in session(${sessionId}).`, code: 404};
    // Verify User in Guild:
    const checkMemberResults = await checkIfUserInGuild(guildId, userId)
    console.log('CHECK MEMBER RESULTS:')
    console.log(JSON.stringify(checkMemberResults, null, 2))
    if(!checkMemberResults.found) throw {message: `Bad Request - User ${userId} is not a member of guild(${guildId}).`, code: 400};

    // 4. Attempt Role Assign:
    const assignResults = await guildManager.guildSessions(guildId).assignUserSessionRole(sessionId, userId, roleName)
    if(!assignResults.success) throw {message: `Internal Server Error - Failed to assign user to "${roleName}" in session(${sessionId}).`, code: 500};
    
    // 4. Return results:
    return responder.succeeded(res, ['Role Assigned!', {sessionId, guildId, roleName, userId}]);
    
} catch (err) {

    if(err?.message){ // Known Error:
        return responder.errored(res, err?.message, err?.code || 400)
    }else{ // Unknown Error:
        return responder.errored(res, 'An internal API error has occurred, please try again.', 500)
    }
    
}})


// DELETE/REMOVE Session Role - Remove User from Role:
router.delete('/:sessionId/roles', verifyToken, verifyGuildAdmin, async (req, res) => { try {
    // 1. Get parameters:
    const sessionId = req.params?.sessionId
    const guildId = req.params?.guildId
    const roleName = req.body?.roleName
    const userId = req.body?.userId

    // 2. Confirm parameters:
    if(!sessionId) throw {message: `Invalid Input - Missing 'sessionId'`, code: 400};
    if(!guildId) throw {message: `Invalid Input - Missing 'guildId'`, code: 400};
    if(!roleName) throw {message: `Invalid Input - Missing 'roleName' inside body of request.`, code: 400};
    if(!userId) throw {message: `Invalid Input - Missing 'userId' inside body of request.`, code: 400};

    // 3. Validate Body:
    const fetchAllSessions = await guildManager.guildSessions(guildId).getSessions()
    if(!fetchAllSessions.success) throw {message: `Internal Error - Failed to fetch guild sessions for guild(${guildId}).`, code: 500};
    /** @type {import('@sessionsbot/api-types').UpcomingSession} */
    const reqSession = fetchAllSessions?.data?.[sessionId];
    // Verify Session Exists:
    if(!reqSession) throw {message: `Not Found - Cannot find session(${sessionId}) in guild(${guildId}).`, code: 404};
    const reqRoleIndex = reqSession?.roles.findIndex((role) => role.roleName === roleName)
    // Verify Role Exists:
    if(reqRoleIndex == -1) throw {message: `Not Found - Cannot find role "${roleName}" in session(${sessionId}).`, code: 404};
    // Verify User in Guild:
    const checkMemberResults = await checkIfUserInGuild(guildId, userId)
    if(!checkMemberResults.found) throw {message: `Bad Request - User ${userId} is not a member of guild(${guildId}).`, code: 400};

    // 4. Attempt Role Assign:
    const assignResults = await guildManager.guildSessions(guildId).removeUserSessionRole(sessionId, userId)
    if(!assignResults.success) throw {message: `Internal Server Error - Failed to remove user from "${roleName}" in session(${sessionId}).`, code: 500};
    
    // 4. Return results:
    return responder.succeeded(res, ['Role Removed!', {sessionId, guildId, roleName, userId}]);
    
} catch (err) {

    if(err?.message){ // Known Error:
        return responder.errored(res, err?.message, err?.code || 400)
    }else{ // Unknown Error:
        return responder.errored(res, 'An internal API error has occurred, please try again.', 500)
    }
    
}})

//-------------------------------------[ Export Endpoints ]-------------------------------------\\
export default router