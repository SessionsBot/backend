//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router();
const responder = require('./utils/responder.js');
const { HttpStatusCode } = require('axios');

// Nested Endpoints:
const users = require('./endpoints/users');
const guilds = require('./endpoints/guilds');
const sessions = require('./endpoints/guilds/sessions');
const schedules = require('./endpoints/guilds/schedules');



//------------------------------------[ Exported Endpoints ]------------------------------------\\
// Endpoints:
router.use('/users', users)
router.use('/guilds', guilds)
router.use('/guilds/:guildId/sessions', sessions)
router.use('/guilds/:guildId/schedules', schedules)

// Root Call:
router.get('/', (req, res) => {
    return responder.errored(res, 'Please provide a valid endpoint', HttpStatusCode.MultipleChoices)
})

// Router:
module.exports = router