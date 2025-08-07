//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router({mergeParams: true})
const responder = require('../utils/responder')



//-----------------------------------------[ Endpoints ]-----------------------------------------\\
// GET/FETCH Session:
router.get('/:sessionId', async (req, res) => {
    const fetchId = req.params.sessionId
    const guildId = req.params?.guildId
    if(!fetchId) return responder.errored(res, `invalid "sessionId" provided`)
    else return responder.succeeded(res, `[GET] Request send for session ${fetchId} | ${guildId}`)
})

// PATCH/UPDATE Session:
router.patch('/:sessionId', async (req, res) => {
    const fetchId = req.params.sessionId
    if(!fetchId) return responder.errored(res, `invalid "sessionId" provided`)
    else return responder.succeeded(res, `[PATCH] Request send for session ${fetchId}`)
})

//-------------------------------------[ Export Endpoints ]-------------------------------------\\
module.exports = router