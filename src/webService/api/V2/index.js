//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router();
const responder = require('./utils/responder.js');
const { HttpStatusCode } = require('axios');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const swaggerDocument = YAML.load(path.join(__dirname, 'docs.yml'));

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

// Serve API docs:
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Router:
module.exports = router