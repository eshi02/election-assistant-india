import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { generateAnswer } from './services/gemini.js';
import { sanitizeInput } from './utils/sanitize.js';
import { translateText } from './services/translate.js';
import { synthesizeSpeech } from './services/tts.js';
import { geocodePincode } from './services/geocode.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Cloud Run sits behind exactly one proxy — required for express-rate-limit
// to read the real client IP from X-Forwarded-For instead of keying every
// request to the load-balancer IP.
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Parse JSON request bodies (1 MB limit)
app.use(express.json({ limit: '1mb' }));

// CORS — in prod we'll restrict to the Firebase domain
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin requests and tools like curl (no origin header)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Don't throw — return false so CORS just blocks instead of crashing
    cb(null, false);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400, // cache preflight 24h
}));

// Global request timeout — protects against slow-loris attacks
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});
// Chat: 20/min (expensive — calls Gemini)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many chat requests. Please slow down.' },
});

// Translate/TTS: 40/min (cheaper)
const utilityLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

// Geocode: 30/min
const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check (Cloud Run pings this)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'election-assistant-backend' });
});

// Main chat endpoint
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required and must be a string' });
    }

    const cleanMessage = sanitizeInput(message);
    if (!cleanMessage) {
      return res.status(400).json({ error: 'Message is empty after sanitization.' });
    }

    const result = await generateAnswer(cleanMessage);
    res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({
      error: 'Something went wrong. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// Translation endpoint
app.post('/api/translate', utilityLimiter, async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ error: 'text and targetLang required' });
    }
    const sanitized = sanitizeInput(text);
    const translated = await translateText(sanitized, targetLang);
    res.json({ translated });
  } catch (err) {
    console.error('Translate error:', err);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Text-to-Speech endpoint
app.post('/api/tts', utilityLimiter, async (req, res) => {
  try {
    const { text, lang } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const sanitized = sanitizeInput(text);
    const audioContent = await synthesizeSpeech(sanitized, lang || 'en');
    res.json({ audioContent }); // base64 MP3
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'Speech synthesis failed' });
  }
});

// Geocoding endpoint (pincode → lat/lng)
app.post('/api/geocode', geocodeLimiter, async (req, res) => {
  try {
    const { pincode } = req.body;
    if (!pincode) return res.status(400).json({ error: 'pincode required' });
    const result = await geocodePincode(pincode);
    res.json(result);
  } catch (err) {
    console.error('Geocode error:', err);
    res.status(400).json({ error: 'Geocoding failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Election Assistant backend listening on port ${PORT}`);
});