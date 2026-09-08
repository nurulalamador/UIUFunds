const pool = require('../config/db');

async function search(req, res) {
  const query = String(req.query.q || '').trim();

  if (!query) return res.json({ results: [] });

  const pattern = `%${query}%`;
  const [users, crowdfundings] = await Promise.all([
    pool.execute(
      `SELECT id, name, username, is_verified
       FROM users
       WHERE role = 'user' AND (name LIKE ? OR username LIKE ? OR uiuid LIKE ?)
       ORDER BY name ASC
       LIMIT 5`,
      [pattern, pattern, pattern],
    ),
    pool.execute(
      `SELECT c.id, c.name, c.description, c.posted_by, u.name AS poster_name,
              CASE WHEN c.image_blob IS NOT NULL
                THEN CONCAT('/crowdfundings/', c.id, '/image')
                ELSE NULL END AS image_url
       FROM crowdfundings c
       JOIN users u ON u.id = c.posted_by
       WHERE c.approval_status = 'approved' AND c.is_approved = TRUE
         AND c.status = 'active' AND (c.name LIKE ? OR c.description LIKE ?)
       ORDER BY c.created_at DESC
       LIMIT 5`,
      [pattern, pattern],
    ),
  ]);

  res.json({
    results: [
      ...users[0].map((user) => ({
        type: 'user',
        id: user.id,
        title: user.name,
        subtitle: `@${user.username}`,
        is_verified: user.is_verified,
      })),
      ...crowdfundings[0].map((campaign) => ({
        type: 'crowdfunding',
        id: campaign.id,
        title: campaign.name,
        subtitle: `By ${campaign.poster_name}`,
        description: campaign.description,
        image_url: campaign.image_url,
      })),
    ],
  });
}

module.exports = { search };