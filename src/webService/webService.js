// HTTP server:
const express = require('express');
const axios = require('axios');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');


// Replace with your real values:
const CLIENT_ID = process.env['CLIENT_ID']
const CLIENT_SECRET = process.env['CLIENT_SECRET']
const REDIRECT_URI = 'https://brilliant-austina-sessions-bot-discord-5fa4fab2.koyeb.app/dashboard/login/discord-redirect'; // Make sure this matches your registered Discord redirect

// Connect to Folder:
app.use(express.static('webService')) 

// Root/Status Respond:
app.get('/', (req, res) => res.status(200).json({ response: 'Root Directory: ALIVE', code: 200, timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) }));
app.get('/status', (req, res) => res.status(200).json({ response: 'Bot is operational!', code: 200, timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) }));

// [WebApp-Frontend] Auth:
require('./discordAuth');

// Initialize:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[🌐 Web Server]: Alive - Running on port ${PORT}`);
});