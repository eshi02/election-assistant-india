import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { generateAnswer } from './services/gemini.js';
import { sanitizeInput } from './utils/sanitize.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Security headers
app.use(helmet());

// CORS — in prod we'll restrict to the Firebase domain
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow same-origin / curl
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
}));

app.use(express.json({ limit: '10kb' }));

// Rate limit: 20 requests / minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
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

app.listen(PORT, () => {
  console.log(`✅ Election Assistant backend on http://localhost:${PORT}`);
});