async function createNotification(conn, {
  userId,
  title,
  description = null,
  onclick = null,
  type = 'general',
}) {
  await conn.execute(
    `INSERT INTO notifications
      (user_id, title, description, onclick, notification_type)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, title, description, onclick, type]
  );
}

module.exports = { createNotification };
