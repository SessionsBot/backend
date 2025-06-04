// Imports:
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.static('webService'));

// Security - Middleware:
const cors = require('cors');

const allowedOrigins = [
  'https://brilliant-austina-sessions-bot-discord-5fa4fab2.koyeb.app',
  'https://sessionsbot.fyi',
  'http://localhost:5173' // for local dev
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));


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
