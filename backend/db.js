const mysql = require('mysql2/promise');
require('dotenv').config();

// ─── Validate required env vars before doing anything ─────────────────────
const REQUIRED = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error('\n❌  Missing required environment variables:');
  missing.forEach(k => console.error(`   • ${k}`));
  console.error('\n   Copy backend/.env.example to backend/.env and fill in the values.\n');
  process.exit(1);
}

// ─── Pool configuration ────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  port:              Number(process.env.DB_PORT) || 3306,
  user:              process.env.DB_USER,
  password:          process.env.DB_PASSWORD,
  database:          process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  // Keeps idle connections alive (MySQL drops them after wait_timeout)
  enableKeepAlive:   true,
  keepAliveInitialDelay: 10000,
  // Automatically reconnect on lost connections
  multipleStatements: false,
});

// ─── Test the connection on startup ───────────────────────────────────────
async function testConnection(retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      console.log(`✅  Database connected  →  ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
      return true;
    } catch (err) {
      console.error(`⚠️   DB connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        console.log(`    Retrying in ${delayMs / 1000}s…`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  console.error('\n❌  Could not connect to MySQL after multiple attempts.');
  console.error('    Check your .env values and make sure MySQL is running.\n');
  process.exit(1);
}

// ─── Graceful shutdown ─────────────────────────────────────────────────────
async function closePool() {
  try {
    await pool.end();
    console.log('🔌  Database pool closed.');
  } catch (err) {
    console.error('Error closing DB pool:', err.message);
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;
module.exports.closePool     = closePool;