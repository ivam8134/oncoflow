const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const db = require('./db');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',   // lock this down in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────
// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/patients',     require('./routes/patients'));
app.use('/api/records',      require('./routes/records'));
app.use('/api/notes',        require('./routes/notes'));
app.use('/api/voice',        require('./routes/voice'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/files',        require('./routes/files'));
app.use('/api/ai',           require('./routes/ai'));
app.use('/api/chat',         require('./routes/chat'));
app.use('/api/translations', require('./routes/translations'));
app.use('/api/chat-ai',      require('./routes/chat-ai'));
app.use('/api/whisper', require('./routes/whisper'));

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/', (_, res) => res.json({ ok: true, service: 'OncoFlow API', version: '1.0.0' }));
app.get('/health', async (_, res) => {
  try {
    const conn = await db.getConnection();
    await conn.ping();
    conn.release();
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, db: 'disconnected', error: err.message });
  }
});

// ─── 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global error handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// ─── Startup ───────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 4000;

async function start() {
  // Test DB connection before accepting traffic
  await db.testConnection();

  const server = app.listen(PORT, () => {
    console.log(`🚀  OncoFlow API running  →  http://localhost:${PORT}`);
    console.log(`    ENV: ${process.env.NODE_ENV || 'development'}`);
  });

  // ─── Graceful shutdown ───────────────────────────────────────────────────
  const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down gracefully…`);
    server.close(async () => {
      await db.closePool();
      console.log('👋  Server closed.');
      process.exit(0);
    });
    // Force exit if close takes too long
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start().catch(err => {
  console.error('❌  Failed to start server:', err.message);
  process.exit(1);
});
