const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function getProfile(req, res) {
  const [rows] = await pool.execute(
    `SELECT id, name, username, email, balance, is_verified, role, created_at, updated_at
     FROM users WHERE id = ?`,
    [req.user.id]
  );
  res.json({ user: rows[0] });
}

async function updateProfile(req, res) {
  const { name, username, email } = req.body;

  const newName = name?.trim() || req.user.name;
  const newUsername = username?.trim().toLowerCase() || req.user.username;
  const newEmail = email?.trim().toLowerCase() || req.user.email;

  const [duplicates] = await pool.execute(
    `SELECT id FROM users
     WHERE (username = ? OR email = ?) AND id <> ? LIMIT 1`,
    [newUsername, newEmail, req.user.id]
  );

  if (duplicates.length) {
    return res.status(409).json({ message: 'Username or email already in use' });
  }

  await pool.execute(
    'UPDATE users SET name = ?, username = ?, email = ? WHERE id = ?',
    [newName, newUsername, newEmail, req.user.id]
  );

  const [rows] = await pool.execute(
    `SELECT id, name, username, email, balance, is_verified, role, created_at, updated_at
     FROM users WHERE id = ?`,
    [req.user.id]
  );

  res.json({ message: 'Profile updated', user: rows[0] });
}

async function changePassword(req, res) {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password || new_password.length < 6) {
    return res.status(400).json({ message: 'Current password and a new password of at least 6 characters are required' });
  }

  const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  const ok = await bcrypt.compare(current_password, rows[0].password_hash);

  if (!ok) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  const hash = await bcrypt.hash(new_password, 12);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

  res.json({ message: 'Password changed successfully' });
}

async function getPublicProfile(req, res) {
  const [rows] = await pool.execute(
    `SELECT id, name, username, is_verified, role, created_at
     FROM users WHERE username = ? LIMIT 1`,
    [req.params.username.toLowerCase()]
  );

  if (!rows.length) return res.status(404).json({ message: 'User not found' });
  res.json({ user: rows[0] });
}

module.exports = { getProfile, updateProfile, changePassword, getPublicProfile };
