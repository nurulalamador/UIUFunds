const pool = require('../config/db');

async function getConversations(req, res) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.username, u.is_verified,
       latest.content AS last_message, latest.sent_at AS last_message_at,
      latest.id AS last_message_id, latest.sender_id AS last_sender_id,
       (SELECT COUNT(*) FROM messages unread
        WHERE unread.sender_id = u.id AND unread.receiver_id = ? AND unread.is_read = FALSE) AS unread_count
     FROM users u
     JOIN messages participant_message
       ON (participant_message.sender_id = u.id AND participant_message.receiver_id = ?)
       OR (participant_message.sender_id = ? AND participant_message.receiver_id = u.id)
     JOIN messages latest ON latest.id = (
       SELECT newest.id FROM messages newest
       WHERE (newest.sender_id = u.id AND newest.receiver_id = ?)
          OR (newest.sender_id = ? AND newest.receiver_id = u.id)
       ORDER BY newest.sent_at DESC, newest.id DESC LIMIT 1
     )
     WHERE u.id <> ?
     GROUP BY u.id, u.name, u.username, u.is_verified,
      latest.id, latest.content, latest.sent_at, latest.sender_id
     ORDER BY latest.sent_at DESC, latest.id DESC`,
    [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
  );
  res.json({ conversations: rows });
}

async function getConversation(req, res) {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ message: 'Invalid user id' });

  const [users] = await pool.execute(
    'SELECT id, name, username, is_verified FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  if (!users.length) return res.status(404).json({ message: 'User not found' });
  if (userId === req.user.id) return res.status(400).json({ message: 'You cannot message yourself' });

  await pool.execute(
    `UPDATE messages SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE`,
    [userId, req.user.id]
  );
  const [messages] = await pool.execute(
    `SELECT id, sender_id, receiver_id, content, is_read, sent_at, read_at
     FROM messages
     WHERE (sender_id = ? AND receiver_id = ?)
        OR (sender_id = ? AND receiver_id = ?)
     ORDER BY sent_at ASC, id ASC`,
    [req.user.id, userId, userId, req.user.id]
  );
  res.json({ user: users[0], messages });
}

async function sendMessage(req, res) {
  const receiverId = Number(req.body.receiver_id);
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  if (!Number.isInteger(receiverId) || receiverId <= 0) return res.status(400).json({ message: 'A valid receiver is required' });
  if (receiverId === req.user.id) return res.status(400).json({ message: 'You cannot message yourself' });
  if (!content) return res.status(400).json({ message: 'Message content is required' });
  if (content.length > 5000) return res.status(400).json({ message: 'Message must be 5000 characters or fewer' });

  const [users] = await pool.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [receiverId]);
  if (!users.length) return res.status(404).json({ message: 'Receiver not found' });
  const [result] = await pool.execute(
    'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
    [req.user.id, receiverId, content]
  );
  res.status(201).json({ message: 'Message sent', message_id: result.insertId });
}

module.exports = { getConversations, getConversation, sendMessage };