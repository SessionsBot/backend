//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router({mergeParams: true})
const responder = require('../../utils/responder');
const { HttpStatusCode } = require('axios');
const guildManager = require('../../../../../utils/guildManager');


// !! DECISION / NOTES !!
/* 
Either:
 /- Make endpoints like /:sessionId/roles/add/:userId, etc.
 or
 /- Make root endpoints like /:sessionId and trust/handle body validation on frontend?
*/


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

// PATCH/UPDATE Session:
router.patch('/:sessionId', async (req, res) => { try {
    // 1. Get parameters:
    const sessionId = req.params?.sessionId
    const guildId = req.params?.guildId
    const newSessionData = req.body?.sessionData
    // 2. Confirm parameters:
    if(!sessionId) throw {message: `Invalid Input - Missing 'sessionId'`, code: 400};
    if(!newSessionData) throw {message: `Invalid Input - Missing 'sessionData' inside body of request.`, code: 400};
    if(!guildId) throw {message: `Invalid Input - Missing 'guildId'`, code: 400};
    // 3. Validate Body:


    
    // 4. Return results:
    return responder.succeeded(res, 'Request allowed - No data to share')
    
} catch (err) {

    if(err?.message){ // Known Error:
        return responder.errored(res, err?.message, err?.code || 400)
    }else{ // Unknown Error:
        return responder.errored(res, 'An internal API error has occurred, please try again.', 500)
    }
    
}})

//-------------------------------------[ Export Endpoints ]-------------------------------------\\
module.exports = router