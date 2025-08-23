//------------------------------------------[ Imports ]------------------------------------------\\
import express from "express";
const router = express.Router({mergeParams: true})
import responder from "../../utils/responder";
import {  HttpStatusCode  } from "axios";
;
import guildManager from "../../../../../utils/guildManager";
import {  client  } from "../../../../../utils/global";
;
import {  checkIfUserInGuild  } from "../../utils/checkGuildMember";
;
import verifyToken from "../../utils/verifyToken";
import verifyGuildMember from "../../utils/verifyMember";


//-----------------------------------------[ Endpoints ]-----------------------------------------\\
// Root Call:
router.get('/', (req, res) => {
    return responder.errored(res, 'Please provide a valid endpoint', HttpStatusCode.MultipleChoices)
})

// GET/FETCH - Read Schedule:
router.get('/:scheduleId', verifyToken, verifyGuildMember, async (req, res) => { try {
    // 1. Get parameters:
    const scheduleId = req.params?.scheduleId
    const guildId = req.params?.guildId
    // 2. Confirm parameters:
    if(!scheduleId) throw {message: `Invalid Input - Missing 'scheduleId'`, code: 400};
    if(!guildId) throw {message: `Invalid Input - Missing 'guildId'`, code: 400};
    // 3. Fetch Attempt:
    const readSchAttempt = await guildManager.guildSchedules(guildId).readSessionSchedule(scheduleId)
    if(!readSchAttempt.success) throw {message: `Not Found - Failed to fetch guild schedule, please try again.`, code: 404};
    
    // 4. Return Result:
    responder.succeeded(res, readSchAttempt.data);

} catch (err) {
    if(err?.message) { // Known Error:
        return responder.errored(res, err.message, err?.code || 400)
    } else { // Unknown Error:
        console.warn('{!}[API] Failed to read schedule data:', JSON.stringify(err, null, 2))
        return responder.errored(res, 'An internal API error has occurred, please try again.', 500)
    }
}})

// POST/ADD - Add Schedule:
router.post('/', verifyToken, verifyGuildMember, async (req, res) => { try {
    // 1. Get parameters:
    const guildId = req.params?.guildId
    const scheduleData = req.body?.scheduleData
    // 2. Confirm parameters:
    if(!guildId) throw {message: `Invalid Input - Missing 'guildId'`, code: 400};
    if(!scheduleData) throw {message: `Invalid Input - Missing 'scheduleData' from request body`, code: 400};
    // 3. Add Schedule Attempt:
    const addSchAttempt = await guildManager.guildSchedules(guildId).addSessionSchedule(scheduleData)
    if(!addSchAttempt.success) throw {message: `Internal Error - Failed to add schedule to guild data, please try again!`, code: 500};
    // 4. Return Result:
    return responder.succeeded(res, ['Schedule Added!', {guildId, scheduleData}]);

} catch (err) {
    if(err?.message) { // Known Error:
        return responder.errored(res, err.message, err?.code || 400)
    } else { // Unknown Error:
        console.warn('{!}[API] Failed to add schedule to guild:', JSON.stringify(err, null, 2))
        return responder.errored(res, 'An internal API error has occurred, please try again.', 500)
    }
}})

// PATCH/UPDATE - Update Schedule:
router.patch('/:scheduleId', verifyToken, verifyGuildMember, async (req, res) => { try {
    // 1. Get parameters:
    const scheduleId = req.params?.scheduleId
    const guildId = req.params?.guildId
    const scheduleData = req.body?.scheduleData
    // 2. Confirm parameters:
    if(!scheduleId) throw {message: `Invalid Input - Missing 'scheduleId'`, code: 400};
    if(!guildId) throw {message: `Invalid Input - Missing 'guildId'`, code: 400};
    if(!scheduleData) throw {message: `Invalid Input - Missing 'scheduleData' from request body`, code: 400};
    // 3. Modify Schedule Attempt:
    const modifySchAttempt = await guildManager.guildSchedules(guildId).modifySessionSchedule(scheduleId, scheduleData)
    if(!modifySchAttempt.success) throw {message: `Internal Error - Failed to add schedule to guild data, please try again!`, code: 500};
    // 4. Return Result:
    return responder.succeeded(res, ['Schedule Modified!', {guildId, scheduleData}]);

} catch (err) {
    if(err?.message) { // Known Error:
        return responder.errored(res, err.message, err?.code || 400)
    } else { // Unknown Error:
        console.warn('{!}[API] Failed to add schedule to guild:', JSON.stringify(err, null, 2))
        return responder.errored(res, 'An internal API error has occurred, please try again.', 500)
    }
}})

// DELETE/REMOVE - Remove Schedule:
router.delete('/:scheduleId', verifyToken, verifyGuildMember, async (req, res) => { try {
    // 1. Get parameters:
    const scheduleId = req.params?.scheduleId
    const guildId = req.params?.guildId
    // 2. Confirm parameters:
    if(!scheduleId) throw {message: `Invalid Input - Missing 'scheduleId'`, code: 400};
    if(!guildId) throw {message: `Invalid Input - Missing 'guildId'`, code: 400};
    // 3. Delete Attempt:
    const deleteAttempt = await guildManager.guildSchedules(guildId).removeSessionSchedule(scheduleId);
    if(!deleteAttempt.success) throw {message: `Internal Error - ${ deleteAttempt?.data |'Failed to add schedule to guild data'}, please try again!`, code: 400};

    // 4. Return Result:
    responder.succeeded(res, deleteAttempt.data);

} catch (err) {
    if(err?.message) { // Known Error:
        return responder.errored(res, err.message, err?.code || 400)
    } else { // Unknown Error:
        console.warn('{!}[API] Failed to read schedule data:', JSON.stringify(err, null, 2))
        return responder.errored(res, 'An internal API error has occurred, please try again.', 500)
    }
}})



//-------------------------------------[ Export Endpoints ]-------------------------------------\\
export default router