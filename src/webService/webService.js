// HTTP server:
const express = require('express');
const axios = require('axios');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();


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