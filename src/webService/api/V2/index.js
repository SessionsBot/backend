//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router()
const responder = require('./utils/responder.js');
const { HttpStatusCode } = require('axios');

// Nested Endpoints:
const users = require('./endpoints/users');
const guilds = require('./endpoints/guilds')
const sessions = require('./endpoints/guilds/sessions');



//------------------------------------[ Exported Endpoints ]------------------------------------\\
// Endpoints:
router.use('/users', users)
router.use('/guilds', guilds)
router.use('/guilds/:guildId/sessions', sessions)

// Root Call:
router.get('/', (req, res) => {
    return responder.errored(res, 'Please provide a valid endpoint', HttpStatusCode.BadRequest)
})

// Router:
module.exports = router