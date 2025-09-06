// App/Imports:
import express from "express";
import global from "../utils/global.js";
const app = express();
app.set('trust proxy', 1) // for: 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR' error
app.use(express.json());

// Security - Middleware:
import cors from "cors";
const allowedOrigins = [
  'https://brilliant-austina-sessions-bot-discord-5fa4fab2.koyeb.app',
  'https://sessionsbot.fyi',
  'https://www.sessionsbot.fyi',
  'http://localhost:5173' // for local dev
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error(`Not allowed by CORS - origin: ${origin}`));
    }
  },
  credentials: true,
}));

// set up rate limiter: maximum of five requests per minute
import RateLimit from "express-rate-limit";
const limiter = RateLimit({
  windowMs: 60 * 1000 * 10, // 10 min(s)
  max: 100, // max requests
  message: 'Too many requests, try again later.',
  standardHeaders: 'draft-6'
});

// apply rate limiter to all requests
app.use(limiter);

// Root/Status Requests:
app.get('/', (req, res) => res.status(200).json({ status: 'ONLINE', version: global.botVersion, message: 'Our Discord/Web-App Backend is currently operational!', }));
app.get('/status', (req, res) => res.status(200).json({ status: 'ONLINE', message: 'Our Discord/Web-App Backend is currently operational!' }));
app.get('/version', (req, res) => res.status(200).json({ version: global.botVersion}));

// Router - API V2:
import apiV2 from "./api/V2/index.js";
app.use('/api/v2', apiV2)

// Initialize Port:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[🌐 Web Server] Running on port ${PORT}`);
});
