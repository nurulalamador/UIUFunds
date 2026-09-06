const pool = require('../config/db');

async function listNotifications(req, res) {
  const [rows] = await pool.execute(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
    [req.user.id]
  );
  res.json({ notifications: rows });
}

async function markRead(req, res) {
  const [result] = await pool.execute(
    `UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Notification not found' });
  res.json({ message: 'Notification marked as read' });
}

async function markAllRead(req, res) {
  await pool.execute(
    `UPDATE notifications SET is_read = TRUE, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE user_id = ? AND is_read = FALSE`,
    [req.user.id]
  );
  res.json({ message: 'All notifications marked as read' });
}

module.exports = { listNotifications, markRead, markAllRead };
