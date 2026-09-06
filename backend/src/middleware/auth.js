const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.slice(7);
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const [rows] = await pool.execute(
    `SELECT id, name, username, email, balance, is_verified, role, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [decoded.userId]
  );

  if (!rows.length) {
    return res.status(401).json({ message: 'User no longer exists' });
  }

  req.user = rows[0];
  next();
});

module.exports = auth;
