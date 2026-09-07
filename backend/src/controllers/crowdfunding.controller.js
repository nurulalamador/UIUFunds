const pool = require('../config/db');
const { addTransaction } = require('../utils/transactions');
const { createNotification } = require('../utils/notifications');

function imageMimeType(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return 'image/jpeg';
  if (buffer.subarray(0, 6).toString() === 'GIF87a' || buffer.subarray(0, 6).toString() === 'GIF89a') return 'image/gif';
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return 'application/octet-stream';
}

async function createCrowdfunding(req, res) {
  const { name, description, target_amount } = req.body;
  const target = Number(target_amount);
  const image = req.file;

  if (!name || !description || !Number.isFinite(target) || target <= 0) {
    return res.status(400).json({ message: 'name, description and a valid target_amount are required' });
  }
  if (!image || !image.mimetype.startsWith('image/')) {
    return res.status(400).json({ message: 'A valid campaign image is required' });
  }

  const [result] = await pool.execute(
    `INSERT INTO crowdfundings (posted_by, name, description, image_blob, target_amount)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, name.trim(), description.trim(), image.buffer, target]
  );

  res.status(201).json({ message: 'Crowdfunding submitted for admin approval', crowdfunding_id: result.insertId });
}

async function listCrowdfundings(req, res) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.posted_by, c.name, c.description, c.target_amount, c.raised_amount,
            c.approval_status, c.is_approved, c.status, c.created_at, c.updated_at,
            CASE WHEN c.image_blob IS NOT NULL THEN TRUE ELSE FALSE END AS has_image,
            u.name AS poster_name, u.username AS poster_username, u.is_verified AS poster_verified,
            (SELECT COUNT(*) FROM crowdfunding_donations d WHERE d.crowdfunding_id = c.id) AS donation_count,
            CASE WHEN c.image_blob IS NOT NULL
                THEN CONCAT('/crowdfundings/', c.id, '/image')
                ELSE NULL END AS image_url
     FROM crowdfundings c
     JOIN users u ON u.id = c.posted_by
     WHERE c.approval_status = 'approved' AND c.is_approved = TRUE AND c.status = "active"
     ORDER BY c.created_at DESC`
  );
  res.json({ crowdfundings: rows });
}

async function getCrowdfunding(req, res) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.posted_by, c.name, c.description, c.target_amount, c.raised_amount,
            c.approval_status, c.is_approved, c.status, c.created_at, c.updated_at,
            CASE WHEN c.image_blob IS NOT NULL THEN TRUE ELSE FALSE END AS has_image,
            CASE WHEN c.image_blob IS NOT NULL
                THEN CONCAT('/crowdfundings/', c.id, '/image')
                ELSE NULL END AS image_url,
            u.name AS poster_name, u.username AS poster_username
     FROM crowdfundings c JOIN users u ON u.id = c.posted_by
     WHERE c.id = ? LIMIT 1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Crowdfunding not found' });

  const campaign = rows[0];
  if (!campaign.is_approved && (!req.user || (req.user.id !== campaign.posted_by && req.user.role !== 'admin'))) {
    return res.status(404).json({ message: 'Crowdfunding not found' });
  }

  const [donations] = await pool.execute(
    `SELECT d.id, d.amount, d.donated_at, u.name AS donor_name, u.username AS donor_username
     FROM crowdfunding_donations d JOIN users u ON u.id = d.donor_id
     WHERE d.crowdfunding_id = ? ORDER BY d.donated_at DESC`,
    [campaign.id]
  );

  const [spendItems] = await pool.execute(
    `SELECT id, crowdfunding_id, name, description, price_per_unit, quantity, total_amount,
            proof_type, spent_at, created_at, updated_at,
            CASE WHEN proof_blob IS NULL THEN FALSE ELSE TRUE END AS has_proof
     FROM crowdfunding_spend_items WHERE crowdfunding_id = ? ORDER BY spent_at DESC`,
    [campaign.id]
  );

  res.json({ crowdfunding: campaign, donations, spend_items: spendItems });
}

async function getCrowdfundingImage(req, res) {
  const [rows] = await pool.execute(
    `SELECT image_blob FROM crowdfundings
     WHERE id = ?
     LIMIT 1`,
    [req.params.id]
  );
  if (!rows.length || !rows[0].image_blob) {
    return res.status(404).json({ message: 'Crowdfunding image not found' });
  }

  res.setHeader('Content-Type', imageMimeType(rows[0].image_blob));
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(rows[0].image_blob);
}

async function myCrowdfundings(req, res) {
  const [rows] = await pool.execute(
    `SELECT id, posted_by, name, description, target_amount, raised_amount,
        approval_status, is_approved, status, created_at, updated_at,
        CASE WHEN image_blob IS NOT NULL THEN TRUE ELSE FALSE END AS has_image,
        CASE WHEN image_blob IS NOT NULL
          THEN CONCAT('/crowdfundings/', id, '/image')
          ELSE NULL END AS image_url
     FROM crowdfundings WHERE posted_by = ? ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ crowdfundings: rows });
}

async function pendingCrowdfundings(req, res) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.posted_by, c.name, c.description, c.target_amount, c.raised_amount,
            c.approval_status, c.is_approved, c.status, c.created_at, c.updated_at,
            u.name AS poster_name, u.username AS poster_username
     FROM crowdfundings c JOIN users u ON u.id = c.posted_by
     WHERE c.approval_status = 'pending' ORDER BY c.created_at ASC`
  );
  res.json({ crowdfundings: rows });
}

async function approveCrowdfunding(req, res) {
  const id = Number(req.params.id);
  const [rows] = await pool.execute('SELECT * FROM crowdfundings WHERE id = ? LIMIT 1', [id]);
  if (!rows.length) return res.status(404).json({ message: 'Crowdfunding not found' });

  await pool.execute(`UPDATE crowdfundings SET approval_status = 'approved', is_approved = TRUE WHERE id = ?`, [id]);
  await pool.execute(
    `INSERT INTO notifications (user_id, title, description, onclick, notification_type)
     VALUES (?, 'Crowdfunding approved', ?, ?, 'crowdfunding')`,
    [rows[0].posted_by, `${rows[0].name} has been approved`, `/crowdfundings/${id}`]
  );
  res.json({ message: 'Crowdfunding approved' });
}

async function rejectCrowdfunding(req, res) {
  const id = Number(req.params.id);
  const [rows] = await pool.execute('SELECT * FROM crowdfundings WHERE id = ? LIMIT 1', [id]);
  if (!rows.length) return res.status(404).json({ message: 'Crowdfunding not found' });

  await pool.execute(`UPDATE crowdfundings SET approval_status = 'rejected', is_approved = FALSE WHERE id = ?`, [id]);
  await pool.execute(
    `INSERT INTO notifications (user_id, title, description, onclick, notification_type)
     VALUES (?, 'Crowdfunding rejected', ?, ?, 'crowdfunding')`,
    [rows[0].posted_by, `${rows[0].name} was not approved`, `/crowdfundings/${id}`]
  );
  res.json({ message: 'Crowdfunding rejected' });
}

async function donate(req, res) {
  const crowdfundingId = Number(req.params.id);
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Valid donation amount required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [campaignRows] = await conn.execute('SELECT * FROM crowdfundings WHERE id = ? FOR UPDATE', [crowdfundingId]);
    if (!campaignRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Crowdfunding not found' });
    }
    const campaign = campaignRows[0];
    if (!campaign.is_approved || campaign.approval_status !== 'approved' || campaign.status !== 'active') {
      await conn.rollback();
      return res.status(400).json({ message: 'This crowdfunding is not accepting donations' });
    }

    const [donorRows] = await conn.execute('SELECT id, name, balance FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
    const [ownerRows] = await conn.execute('SELECT id, name, balance FROM users WHERE id = ? FOR UPDATE', [campaign.posted_by]);
    const donor = donorRows[0];
    const owner = ownerRows[0];

    if (donor.id === owner.id) {
      await conn.rollback();
      return res.status(400).json({ message: 'You cannot donate to your own crowdfunding campaign' });
    }

    if (Number(donor.balance) < amount) {
      await conn.rollback();
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    await conn.execute('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, donor.id]);
    await conn.execute('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, owner.id]);

    const [donation] = await conn.execute(
      'INSERT INTO crowdfunding_donations (crowdfunding_id, donor_id, amount) VALUES (?, ?, ?)',
      [crowdfundingId, donor.id, amount]
    );

    const newRaised = Number((Number(campaign.raised_amount) + amount).toFixed(2));
    const status = newRaised >= Number(campaign.target_amount) ? 'completed' : 'active';
    await conn.execute('UPDATE crowdfundings SET raised_amount = ?, status = ? WHERE id = ?', [newRaised, status, crowdfundingId]);

    await addTransaction(conn, {
      userId: donor.id,
      title: `Donation to ${campaign.name}`,
      amount,
      transactionType: 'crowdfunding_donation',
      direction: 'debit',
      transactedTo: owner.id,
      transactedFrom: donor.id,
      referenceType: 'crowdfunding_donation',
      referenceId: donation.insertId,
    });

    await addTransaction(conn, {
      userId: owner.id,
      title: `Donation received for ${campaign.name}`,
      amount,
      transactionType: 'crowdfunding_received',
      direction: 'credit',
      transactedTo: owner.id,
      transactedFrom: donor.id,
      referenceType: 'crowdfunding_donation',
      referenceId: donation.insertId,
    });

    await createNotification(conn, {
      userId: owner.id,
      title: 'New crowdfunding donation',
      description: `${donor.name} donated ${amount} to ${campaign.name}`,
      onclick: `/crowdfundings/${crowdfundingId}`,
      type: 'crowdfunding',
    });

    await conn.commit();
    res.status(201).json({ message: 'Donation successful', donation_id: donation.insertId, raised_amount: newRaised });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function addSpendItem(req, res) {
  const crowdfundingId = Number(req.params.id);
  const { name, description = null, price_per_unit, quantity = 1, proof_type = null } = req.body;
  const price = Number(price_per_unit);
  const qty = Number(quantity);

  if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ message: 'name, valid price_per_unit and quantity are required' });
  }

  const [campaignRows] = await pool.execute('SELECT * FROM crowdfundings WHERE id = ? LIMIT 1', [crowdfundingId]);
  if (!campaignRows.length) return res.status(404).json({ message: 'Crowdfunding not found' });
  const campaign = campaignRows[0];

  if (campaign.posted_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the crowdfunding owner can add spend items' });
  }
  if (!campaign.is_approved) return res.status(400).json({ message: 'Crowdfunding must be approved first' });

  const total = Number((price * qty).toFixed(2));
  const [spentRows] = await pool.execute(
    'SELECT COALESCE(SUM(total_amount), 0) AS spent FROM crowdfunding_spend_items WHERE crowdfunding_id = ?',
    [crowdfundingId]
  );
  const spent = Number(spentRows[0].spent);

  if (spent + total > Number(campaign.raised_amount)) {
    return res.status(400).json({ message: 'Total reported spending cannot exceed raised amount' });
  }

  const file = req.file || null;
  let normalizedProofType = proof_type || null;
  if (file && !normalizedProofType) {
    normalizedProofType = file.mimetype === 'application/pdf' ? 'pdf' : (file.mimetype.startsWith('image/') ? 'image' : 'other');
  }

  const [result] = await pool.execute(
    `INSERT INTO crowdfunding_spend_items
      (crowdfunding_id, name, description, price_per_unit, quantity, total_amount,
       proof_type, proof_mime_type, proof_file_name, proof_blob)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crowdfundingId, name.trim(), description, price, qty, total,
      normalizedProofType, file?.mimetype || null, file?.originalname || null, file?.buffer || null,
    ]
  );

  res.status(201).json({ message: 'Spend item added', spend_item_id: result.insertId, total_amount: total });
}

async function getSpendProof(req, res) {
  const [rows] = await pool.execute(
    `SELECT proof_blob, proof_mime_type, proof_file_name
     FROM crowdfunding_spend_items WHERE id = ? LIMIT 1`,
    [req.params.spendId]
  );
  if (!rows.length || !rows[0].proof_blob) return res.status(404).json({ message: 'Proof not found' });

  res.setHeader('Content-Type', rows[0].proof_mime_type || 'application/octet-stream');
  if (rows[0].proof_file_name) {
    res.setHeader('Content-Disposition', `inline; filename="${rows[0].proof_file_name.replace(/"/g, '')}"`);
  }
  res.send(rows[0].proof_blob);
}


async function listCrowdfundings(req, res) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.posted_by, c.name, c.description, c.target_amount, c.raised_amount,
            c.approval_status, c.is_approved, c.status, c.created_at, c.updated_at,
            CASE WHEN c.image_blob IS NOT NULL THEN TRUE ELSE FALSE END AS has_image,
            u.name AS poster_name, u.username AS poster_username, u.is_verified AS poster_verified,
            (SELECT COUNT(*) FROM crowdfunding_donations d WHERE d.crowdfunding_id = c.id) AS donation_count,
            CASE WHEN c.image_blob IS NOT NULL
                THEN CONCAT('/crowdfundings/', c.id, '/image')
                ELSE NULL END AS image_url
     FROM crowdfundings c
     JOIN users u ON u.id = c.posted_by
     WHERE c.approval_status = 'approved' AND c.is_approved = TRUE AND c.status = "active"
     ORDER BY c.created_at DESC`
  );
  res.json({ crowdfundings: rows });
}

async function listCompletedCrowdfundings(req, res) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.posted_by, c.name, c.description, c.target_amount, c.raised_amount,
            c.approval_status, c.is_approved, c.status, c.created_at, c.updated_at,
            CASE WHEN c.image_blob IS NOT NULL THEN TRUE ELSE FALSE END AS has_image,
            u.name AS poster_name, u.username AS poster_username, u.is_verified AS poster_verified,
            (SELECT COUNT(*) FROM crowdfunding_donations d WHERE d.crowdfunding_id = c.id) AS donation_count,
            CASE WHEN c.image_blob IS NOT NULL
                THEN CONCAT('/crowdfundings/', c.id, '/image')
                ELSE NULL END AS image_url
     FROM crowdfundings c
     JOIN users u ON u.id = c.posted_by
     WHERE c.approval_status = 'approved' AND c.is_approved = TRUE AND c.status = 'completed'
     ORDER BY c.created_at DESC`
  );
  res.json({ crowdfundings: rows });
}

module.exports = {
  createCrowdfunding, listCrowdfundings, listCompletedCrowdfundings, getCrowdfunding, myCrowdfundings,
  getCrowdfundingImage,
  pendingCrowdfundings, approveCrowdfunding, rejectCrowdfunding,
  donate, addSpendItem, getSpendProof,
};
