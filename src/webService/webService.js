// App/Imports:
const express = require('express');
const global = require('../utils/global.js')
const app = express();
app.use(express.json());
require('dotenv').config();

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
  // methods: ['GET', 'POST', 'OPTIONS'] -- Allow all?
}));


// Root/Status Requests:
app.get('/', (req, res) => res.status(200).json({ status: 'ONLINE', version: global.botVersion, message: 'Our Discord/Web-App Backend is currently operational!', }));
app.get('/status', (req, res) => res.status(200).json({ status: 'ONLINE', message: 'Our Discord/Web-App Backend is currently operational!' }));
app.get('/version', (req, res) => res.status(200).json({ version: global.botVersion}));

// Discord Auth Requests:
const discordAuthRouter = require('./discordAuth.js');
app.use('/api', discordAuthRouter); // or just app.use(discordAuthRouter);

// Router - API V2:
const apiV2 = require('./api/V2')
app.use('/api/v2', apiV2)

// Initialize Port:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[🌐 Web Server]: Alive - Running on port ${PORT}`);
});
