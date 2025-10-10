import express from "express";
import {  HttpStatusCode  } from "axios";
import responder from "../../utils/responder.js";
import { checkSystemStatuses } from "../../utils/systemStatuses.js";
import scheduleManager from "../../../../../utils/scheduleManager.js";
const router = express.Router()

// Root Call - $URL/api/v2/system/
router.get('/', (req, res) => {
    return responder.errored(res, 'Please provide a valid endpoint', HttpStatusCode.MultipleChoices)
});


// Status Endpoint - $URL/api/v2/system/status
router.get('/status', async (req, res) => {
    // Attempt fetch system statuses:
    const results = await checkSystemStatuses();
    if(!results.success){ // Failed to fetch status(es):
        // Respond/Return Error 
        return responder.errored(res, `Internal server error, failed to fetch system statuses!`, 500);
    } else { // Succeeded to fetch status(es):
        // Respond/Return Success 
        return responder.succeeded(res, results?.data);
    }
});


/** System - View Current Guild Session Postings Scheduled */
router.get('/current-post-schedules', async (req, res) => {
    const currentObjectSchedules = Object.entries(scheduleManager.getCurrentServerSessionSchedules())
    const jsonSchedules = currentObjectSchedules.map(item => { 
        return {
            [item[0]]: {
                status: item[1].getStatus(),
                nextRun: item[1].getNextRun(),
            }
        }
    })
    return res.send(jsonSchedules)
});


export default router;