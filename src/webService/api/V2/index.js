//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router()

// + Nested Endpoints:
const users = require('./users.js')
// const guilds = require('./guilds.js')
// const sessions = require('./sessions.js');


//------------------------------------[ Exported Endpoints ]------------------------------------\\
// Endpoints:
router.use('/users' ,users)

// Router:
module.exports = router