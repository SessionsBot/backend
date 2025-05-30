// Imports:
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.static('webService'));

// Root/Status Requests:
app.get('/', (req, res) => res.status(200).json({ response: 'Root Directory: ALIVE', code: 200 }));
app.get('/status', (req, res) => res.status(200).json({ response: 'Bot is operational!', code: 200 }));

// Discord Auth Requests:
require('./discordAuth.js')(app, axios, jwt);

// Initialize Port:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[🌐 Web Server]: Alive - Running on port ${PORT}`);
});
