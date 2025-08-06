//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router()
const responder = require('../utils/responder')



//-----------------------------------------[ Endpoints ]-----------------------------------------\\
// GET/FETCH Guild:
router.get('/:guildId', async (req, res) => {
    const fetchId = req.params.guildId
    if(!fetchId) return responder.errored(res, `invalid "guildId" provided`)
    else return responder.succeeded(res, `[GET] Request send for guild ${fetchId}`)
})

//-------------------------------------[ Export Endpoints ]-------------------------------------\\
module.exports = router