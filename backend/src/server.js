require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and configure it.');
  process.exit(1);
}

const app = require('./app');
const pool = require('./config/db');

const PORT = Number(process.env.PORT || 5000);

async function start() {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();

    app.listen(PORT, () => {
      console.log(`UIULoans API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Could not connect to MySQL:', error.message);
    process.exit(1);
  }
}

start();
