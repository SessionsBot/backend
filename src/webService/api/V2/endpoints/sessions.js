//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router()
const responder = require('../utils/responder')



//-----------------------------------------[ Endpoints ]-----------------------------------------\\
// GET/FETCH Session:
router.get('/:sessionId', async (req, res) => {
    const fetchId = req.params.sessionId
    if(!fetchId) return responder.errored(res, `invalid "sessionId" provided`)
    else return responder.succeeded(res, `[GET] Request send for session ${fetchId}`)
})

//-------------------------------------[ Export Endpoints ]-------------------------------------\\
module.exports = router