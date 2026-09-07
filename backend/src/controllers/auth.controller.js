const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function signToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res) {
  const { name, username, uiuid, email, password } = req.body;
  console.log(name, username, uiuid);

  if (!name || !username || !uiuid || !email || !password) {
    return res.status(400).json({ message: 'Name, username, UIU ID, email and password are required!' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
    [normalizedEmail, normalizedUsername]
  );

  if (existing.length) {
    return res.status(409).json({ message: 'Email or username already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [result] = await pool.execute(
    `INSERT INTO users (name, username, uiuid, email, password_hash)
     VALUES (?, ?, ?, ?, ?)`,
    [name.trim(), normalizedUsername, uiuid, normalizedEmail, passwordHash]
  );

  const token = signToken(result.insertId);

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: result.insertId,
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      uiuid: uiuid,
      balance: 0,
      is_verified: false,
      role: 'user',
    },
  });
}

async function login(req, res) {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'identifier and password are required' });
  }

  const normalized = identifier.trim().toLowerCase();

  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1',
    [normalized, normalized]
  );

  if (!rows.length) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);

  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken(user.id);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      uiuid: user.uiuid,
      balance: user.balance,
      is_verified: Boolean(user.is_verified),
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  });
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };
