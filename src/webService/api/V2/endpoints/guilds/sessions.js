//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router({mergeParams: true})
const responder = require('../../utils/responder');
const { HttpStatusCode } = require('axios');
const guildManager = require('../../../../../utils/guildManager');
const { client } = require('../../../../../utils/global');
const { checkIfUserInGuild } = require('../../utils/checkGuildMember');


//-----------------------------------------[ Endpoints ]-----------------------------------------\\
// GET/FETCH Session:
router.get('/:sessionId', async (req, res) => { try {
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


// ------ { Session Roles } ------


// PATCH/UPDATE Session Role - Add User to Role:
router.patch('/:sessionId/roles', async (req, res) => { try {
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
router.delete('/:sessionId/roles', async (req, res) => { try {
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
module.exports = router