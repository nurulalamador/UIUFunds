const pool = require('../config/db');

async function listUsers(req, res) {
  const status = req.query.status === 'pending' ? 'pending' : 'approved';
  const condition = status === 'pending' ? 'is_verified = FALSE' : 'is_verified = TRUE';
  const [users] = await pool.execute(
    `SELECT id, name, username, uiuid, email, balance, is_verified, role, created_at
     FROM users WHERE ${condition} ORDER BY created_at DESC`
  );
  res.json({ users });
}

async function approveUser(req, res) {
  const [result] = await pool.execute(
    "UPDATE users SET is_verified = TRUE WHERE id = ? AND role <> 'admin'",
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User approved' });
}

async function deleteUser(req, res) {
  if (Number(req.params.id) === Number(req.user.id)) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  const [result] = await pool.execute(
    "DELETE FROM users WHERE id = ? AND role <> 'admin'",
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
}

function postQuery() {
  return `SELECT p.id, p.content, p.created_at, u.name AS poster_name, u.username AS poster_username,
      (SELECT COUNT(*) FROM reported_posts r WHERE r.post_id = p.id) AS report_count,
      (SELECT MAX(r.reported_at) FROM reported_posts r WHERE r.post_id = p.id) AS last_reported_at
    FROM community_posts p JOIN users u ON u.id = p.poster_id`;
}

async function listAdminPosts(req, res) {
  const reportedOnly = req.query.tab === 'reported';
  const [posts] = await pool.execute(
    `${postQuery()} ${reportedOnly ? 'WHERE EXISTS (SELECT 1 FROM reported_posts r WHERE r.post_id = p.id)' : ''}
     ORDER BY p.created_at DESC LIMIT 200`
  );
  res.json({ posts });
}

async function deletePost(req, res) {
  const [result] = await pool.execute('DELETE FROM community_posts WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Post not found' });
  res.json({ message: 'Post deleted' });
}

async function listCrowdfundings(req, res) {
  const status = req.query.status === 'active' ? "c.status = 'active' AND c.approval_status = 'approved'" : "c.approval_status = 'pending'";
  const [crowdfundings] = await pool.execute(
    `SELECT c.id, c.name, c.description, c.target_amount, c.raised_amount, c.approval_status,
        c.is_approved, c.status, c.created_at, u.name AS poster_name, u.username AS poster_username
     FROM crowdfundings c JOIN users u ON u.id = c.posted_by
     WHERE ${status} ORDER BY c.created_at DESC`
  );
  res.json({ crowdfundings });
}

async function approveCrowdfunding(req, res) {
  const [result] = await pool.execute(
    "UPDATE crowdfundings SET approval_status = 'approved', is_approved = TRUE WHERE id = ? AND approval_status = 'pending'",
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Pending crowdfunding not found' });
  res.json({ message: 'Crowdfunding approved' });
}

async function deleteCrowdfunding(req, res) {
  const [result] = await pool.execute(
    "DELETE FROM crowdfundings WHERE id = ? AND status = 'active'",
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Ongoing crowdfunding not found' });
  res.json({ message: 'Crowdfunding deleted' });
}

async function listLoans(req, res) {
  const [loans] = await pool.execute(
    `SELECT l.id, l.requester_id, l.amount, l.duration_months, l.description,
        l.interest_allowed, l.installment, l.status, l.created_at,
        u.name AS requester_name, u.username AS requester_username,
        u.is_verified AS requester_verified,
        (SELECT COUNT(*) FROM loan_offers lo WHERE lo.loan_id = l.id AND lo.status = 'pending') AS offer_count
     FROM loans l JOIN users u ON u.id = l.requester_id
     ORDER BY l.created_at DESC`
  );
  res.json({ loans });
}

module.exports = {
  listUsers, approveUser, deleteUser, listAdminPosts, deletePost,
  listCrowdfundings, approveCrowdfunding, deleteCrowdfunding, listLoans,
};