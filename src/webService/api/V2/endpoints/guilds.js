//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router()
const responder = require('../utils/responder')
const { default: axios, HttpStatusCode } = require('axios');
const verifyToken = require('../utils/verifyToken');
const { admin } = require('../../../../utils/firebase');
const auth = admin.auth();


//-----------------------------------------[ Endpoints ]-----------------------------------------\\
// GET/FETCH Guild:
router.get('/:guildId', async (req, res) => {
    const fetchId = req.params.guildId
    if(!fetchId) return responder.errored(res, `invalid "guildId" provided`)
    else return responder.succeeded(res, `[GET] Request send for guild ${fetchId}`)
})

// GET/FETCH Guild:
router.delete('/:guildId', verifyToken, async (req, res) => {
    const deleteId = req.params.guildId
    if(!deleteId) return responder.errored(res, `invalid "guildId" provided`)
    const actingUser = req?.user

    // Get acting users manageable guilds:
    // ! CANNOT GET CUSTOM CLAIMS FROM THIS TOKEN
    // + need to find/retrieve a firebase session token not custom token to verify claims??
    // auth.verifyIdToken(actingUser?.firebaseToken).then((decoded) => {
    //     console.log('Token verified:')
    //     console.log(decoded)
    // }).catch((err) => {
    //     console.log('Token error')
    //     console.log(err)
    // })

    return responder.succeeded(res, `[DELETE] Request send for guild ${deleteId}`)
})

//-------------------------------------[ Export Endpoints ]-------------------------------------\\
module.exports = router