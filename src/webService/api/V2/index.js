//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router()

// + Nested Endpoints:
const users = require('./users.js')
const guilds = require('./guilds.js')
const sessions = require('./sessions.js');

//------------------------------------[ Exported Utilities ]------------------------------------\\

/** Used for sending consistent API responses, for both successful and unsuccessful responses */
const responder = {

    /** On success, respond to the API request.
     * @returns {import('@sessionsbot/api-types').APIResponse} */
    succeeded: (res, data = {}, status = 200) => {
        return res.status(status).json({
            success: true,
            data,
            error: null
        })
    },

    /** On error, respond to the API request. 
     * @returns {import('@sessionsbot/api-types').APIResponse} */
    errored: (res, message, status = 500) => {
        return res.status(status).json({
            success: false,
            data: null,
            error: { 
                code: status,
                message
            }
        });
    },
}

//------------------------------------[ Exported Endpoints ]------------------------------------\\

// Nested Endpoints:
router.use('/users' ,users)
router.use('/guilds' ,guilds)

// Response Helper:
module.exports = {
    responder
}