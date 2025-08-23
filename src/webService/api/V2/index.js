//------------------------------------------[ Imports ]------------------------------------------\\
import express from "express";
const router = express.Router();
import responder from "./utils/responder.js";
import {  HttpStatusCode  } from "axios";
;

import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
const swaggerDocument = YAML.load(path.join(__dirname, 'docs.yml'));

// Nested Endpoints:
import users from "./endpoints/users";
import guilds from "./endpoints/guilds";
import sessions from "./endpoints/guilds/sessions";
import schedules from "./endpoints/guilds/schedules";



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
export default router