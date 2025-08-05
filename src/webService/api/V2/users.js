//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router()
const responder = require('./').responder



//------------------------------------[ Endpoints ]------------------------------------\\

router.get('/users/:userId', async (req, res) => {
    const fetchId = req.params.userId
    if(!fetchId) return responder.errored(res, `invalid "userId" provided`)
    else return responder.succeeded(res, `[GET] Request send for user ${fetchId}`)
})


router.delete('/user/:userId', async (req, res) => {
    const fetchId = req.params.userId
    if(!fetchId) return responder.errored(res, `invalid "userId" provided`)
    else return responder.succeeded(res, `[DELETE] Request send for user ${fetchId}`)
})