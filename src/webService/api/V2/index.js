//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router()
const responder = require('./utils/responder.js');
const { HttpStatusCode } = require('axios');

// Nested Endpoints:
const users = require('./endpoints/users.js');
const guilds = require('./endpoints/guilds.js')
const sessions = require('./endpoints/sessions.js');



//------------------------------------[ Exported Endpoints ]------------------------------------\\
// Endpoints:
router.use('/users', users)
router.use('/guilds', guilds)
router.use('/sessions', sessions)

// Root Call:
router.get('/', (req, res) => {
    return res.status(204).send('Sessions Bot - API - v2')
})

// Router:
module.exports = router