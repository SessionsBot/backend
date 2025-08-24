//------------------------------------------[ Imports ]------------------------------------------\\
import express from "express";
const router = express.Router();
import responder from "./utils/responder.js";
import {  HttpStatusCode  } from "axios";

import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import YAML from 'yamljs';

const __filename = fileURLToPath(import.meta.url); // equivalent of __filename
const __dirname = dirname(__filename);            // equivalent of __dirname

const swaggerDocument = YAML.load(join(__dirname, 'docs.yml'));

// Nested Endpoints:
import users from "./endpoints/users/index.js";
import guilds from "./endpoints/guilds/index.js";
import sessions from "./endpoints/guilds/sessions.js";
import schedules from "./endpoints/guilds/schedules.js";



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