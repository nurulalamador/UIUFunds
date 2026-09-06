const pool = require('../config/db');
const { addTransaction } = require('../utils/transactions');

async function myTransactions(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const [rows] = await pool.query(
    `SELECT * FROM transactions
     WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [req.user.id, limit]
  );
  res.json({ transactions: rows });
}

async function demoTopup(req, res) {
  if (process.env.ENABLE_DEMO_TOPUP !== 'true') {
    return res.status(403).json({ message: 'Demo top-up is disabled' });
  }

  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
    return res.status(400).json({ message: 'Enter a valid amount between 0 and 1,000,000' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, req.user.id]);
    await addTransaction(conn, {
      userId: req.user.id,
      title: 'Demo wallet top-up',
      amount,
      transactionType: 'deposit',
      direction: 'credit',
      transactedTo: req.user.id,
      referenceType: 'other',
    });
    await conn.commit();
    const [rows] = await pool.execute('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Demo top-up successful', balance: rows[0].balance });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { myTransactions, demoTopup };
