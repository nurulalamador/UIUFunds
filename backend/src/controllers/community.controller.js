const pool = require('../config/db');

function mediaTypeFromMime(mime) {
  if (mime?.startsWith('image/')) return 'image';
  if (mime?.startsWith('video/')) return 'video';
  if (mime?.startsWith('audio/')) return 'audio';
  return 'file';
}

async function createPost(req, res) {
  const content = req.body.content?.trim();
  if (!content) return res.status(400).json({ message: 'Post content is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [post] = await conn.execute(
      'INSERT INTO community_posts (poster_id, content, is_approved) VALUES (?, ?, TRUE)',
      [req.user.id, content]
    );

    for (const file of req.files || []) {
      await conn.execute(
        `INSERT INTO community_post_media (post_id, media_type, media_blob)
         VALUES (?, ?, ?)`,
        [post.insertId, mediaTypeFromMime(file.mimetype), file.buffer]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Community post created', post_id: post.insertId });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function listPosts(req, res) {
  const [rows] = await pool.execute(
    `SELECT p.*, u.name AS poster_name, u.username AS poster_username, u.is_verified AS poster_verified,
       (SELECT COUNT(*) FROM community_post_reacts r WHERE r.post_id = p.id) AS react_count,
       EXISTS(SELECT 1 FROM community_post_reacts ur WHERE ur.post_id = p.id AND ur.reactor_id = ?) AS is_reacted,
       (SELECT COUNT(*) FROM community_post_comments c WHERE c.post_id = p.id) AS comment_count,
       (SELECT COUNT(*) FROM community_post_media m WHERE m.post_id = p.id) AS media_count,
       (SELECT CONCAT('[', COALESCE(GROUP_CONCAT(
          JSON_OBJECT('media_type', m.media_type, 'media_url', CONCAT('/community/media/', m.id))
          SEPARATOR ','
        ), ''), ']')
        FROM community_post_media m WHERE m.post_id = p.id) AS media
     FROM community_posts p JOIN users u ON u.id = p.poster_id
      WHERE p.is_approved = TRUE ORDER BY p.created_at DESC LIMIT 100`,
     [req.user.id]
  );
  for (const post of rows) {
    if (typeof post.media === 'string') post.media = JSON.parse(post.media);
  }
  res.json({ posts: rows });
}

async function getPost(req, res) {
  const [rows] = await pool.execute(
    `SELECT p.*, u.name AS poster_name, u.username AS poster_username, u.is_verified AS poster_verified,
       (SELECT COUNT(*) FROM community_post_reacts r WHERE r.post_id = p.id) AS react_count,
       EXISTS(SELECT 1 FROM community_post_reacts ur WHERE ur.post_id = p.id AND ur.reactor_id = ?) AS is_reacted,
       (SELECT COUNT(*) FROM community_post_comments c WHERE c.post_id = p.id) AS comment_count,
       (SELECT COUNT(*) FROM community_post_media m WHERE m.post_id = p.id) AS media_count,
       (SELECT CONCAT('[', COALESCE(GROUP_CONCAT(
          JSON_OBJECT('media_type', m.media_type, 'media_url', CONCAT('/community/media/', m.id))
          SEPARATOR ','
        ), ''), ']')
        FROM community_post_media m WHERE m.post_id = p.id) AS media
     FROM community_posts p JOIN users u ON u.id = p.poster_id
      WHERE p.id = ? AND p.is_approved = TRUE LIMIT 1`,
    [req.user.id, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Post not found' });

  const [comments] = await pool.execute(
    `SELECT c.*, u.name AS commenter_name, u.username AS commenter_username
     FROM community_post_comments c JOIN users u ON u.id = c.commenter_id
     WHERE c.post_id = ? ORDER BY c.created_at ASC`,
    [req.params.id]
  );

  res.json({ post: rows[0], comments });
}

async function getMedia(req, res) {
  const [rows] = await pool.execute('SELECT * FROM community_post_media WHERE id = ? LIMIT 1', [req.params.mediaId]);
  if (!rows.length) return res.status(404).json({ message: 'Media not found' });
  const media = rows[0];
  res.setHeader('Content-Type', media.mime_type || 'application/octet-stream');
  res.send(media.media_blob);
}

async function toggleReact(req, res) {
  const postId = Number(req.params.id);

  const [posts] = await pool.execute(
    'SELECT id FROM community_posts WHERE id = ? AND is_approved = TRUE LIMIT 1',
    [postId]
  );
  if (!posts.length) return res.status(404).json({ message: 'Post not found' });

  const [existing] = await pool.execute(
    'SELECT post_id FROM community_post_reacts WHERE post_id = ? AND reactor_id = ?',
    [postId, req.user.id]
  );

  if (existing.length) {
    await pool.execute('DELETE FROM community_post_reacts WHERE post_id = ? AND reactor_id = ?', [postId, req.user.id]);
    return res.json({ reacted: false });
  }

  await pool.execute('INSERT INTO community_post_reacts (post_id, reactor_id) VALUES (?, ?)', [postId, req.user.id]);
  res.json({ reacted: true });
}

async function addComment(req, res) {
  const content = req.body.content?.trim();
  if (!content) return res.status(400).json({ message: 'Comment content required' });

  const [posts] = await pool.execute(
    'SELECT id FROM community_posts WHERE id = ? AND is_approved = TRUE LIMIT 1',
    [req.params.id]
  );
  if (!posts.length) return res.status(404).json({ message: 'Post not found' });

  const [result] = await pool.execute(
    'INSERT INTO community_post_comments (post_id, commenter_id, content) VALUES (?, ?, ?)',
    [req.params.id, req.user.id, content]
  );
  res.status(201).json({ message: 'Comment added', comment_id: result.insertId });
}

async function reportPost(req, res) {
  const postId = Number(req.params.id);
  const [posts] = await pool.execute('SELECT id FROM community_posts WHERE id = ? LIMIT 1', [postId]);
  if (!posts.length) return res.status(404).json({ message: 'Post not found' });

  await pool.execute(
    'INSERT IGNORE INTO reported_posts (post_id, reporter_id) VALUES (?, ?)',
    [postId, req.user.id]
  );
  res.status(201).json({ message: 'Post reported' });
}

module.exports = { createPost, listPosts, getPost, getMedia, toggleReact, addComment, reportPost };
