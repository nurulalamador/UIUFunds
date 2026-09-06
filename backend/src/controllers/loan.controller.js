const pool = require('../config/db');
const { addTransaction } = require('../utils/transactions');
const { createNotification } = require('../utils/notifications');

async function createLoan(req, res) {
  const { amount, duration_months, description, interest_allowed = true, installment = 1 } = req.body;
  const money = Number(amount);
  const duration = Number(duration_months);
  const installmentCount = Number(installment);

  if (!Number.isFinite(money) || money <= 0 || !Number.isInteger(duration) || duration <= 0 || !description) {
    return res.status(400).json({ message: 'Valid amount, duration_months and description are required' });
  }

  if (!Number.isInteger(installmentCount) || installmentCount <= 0) {
    return res.status(400).json({ message: 'installment must be a positive integer' });
  }

  const normalizedInterestAllowed = ![false, 0, '0', 'false'].includes(interest_allowed);

  const [result] = await pool.execute(
    `INSERT INTO loans
      (requester_id, amount, duration_months, description, interest_allowed, installment)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, money, duration, description.trim(), normalizedInterestAllowed, installmentCount]
  );

  res.status(201).json({ message: 'Loan request created', loan_id: result.insertId });
}

async function listLoans(req, res) {
  const status = req.query.status || 'open';
  const allowed = ['open', 'offer_accepted', 'funded', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const [rows] = await pool.execute(
    `SELECT l.*, u.name AS requester_name, u.username AS requester_username, u.is_verified AS requester_verified,
            (SELECT COUNT(*) FROM loan_offers lo WHERE lo.loan_id = l.id AND lo.status = 'pending') AS offer_count
     FROM loans l
     JOIN users u ON u.id = l.requester_id
     WHERE l.status = ?
     ORDER BY l.created_at DESC`,
    [status]
  );

  res.json({ loans: rows });
}

async function getLoan(req, res) {
  const [rows] = await pool.execute(
    `SELECT l.*, u.name AS requester_name, u.username AS requester_username, u.is_verified AS requester_verified,
            (SELECT COUNT(*) FROM loan_offers lo WHERE lo.loan_id = l.id AND lo.status = 'pending') AS offer_count
     FROM loans l
     JOIN users u ON u.id = l.requester_id
     WHERE l.id = ? LIMIT 1`,
    [req.params.id]
  );

  if (!rows.length) return res.status(404).json({ message: 'Loan not found' });
  res.json({ loan: rows[0] });
}

async function myLoanRequests(req, res) {
  const [rows] = await pool.execute(
    `SELECT l.*,
            (SELECT COUNT(*) FROM loan_offers lo WHERE lo.loan_id = l.id AND lo.status = 'pending') AS pending_offer_count
     FROM loans l WHERE requester_id = ? ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ loans: rows });
}

async function createOffer(req, res) {
  const loanId = Number(req.params.id);
  const { interest_rate = 0, asked_duration_months } = req.body;
  const rate = Number(interest_rate);
  const duration = Number(asked_duration_months);

  if (!Number.isFinite(rate) || rate < 0 || !Number.isInteger(duration) || duration <= 0) {
    return res.status(400).json({ message: 'Valid interest_rate and asked_duration_months are required' });
  }

  const [loans] = await pool.execute('SELECT * FROM loans WHERE id = ? LIMIT 1', [loanId]);
  if (!loans.length) return res.status(404).json({ message: 'Loan not found' });

  const loan = loans[0];
  if (loan.status !== 'open') return res.status(400).json({ message: 'This loan is not accepting offers' });
  if (loan.requester_id === req.user.id) return res.status(400).json({ message: 'You cannot offer on your own loan request' });
  if (!loan.interest_allowed && rate > 0) return res.status(400).json({ message: 'This requester does not allow interest' });

  if (Number(req.user.balance) < Number(loan.amount)) {
    return res.status(400).json({ message: 'Your current balance is lower than the requested loan amount' });
  }

  const [result] = await pool.execute(
    `INSERT INTO loan_offers (offeror_id, loan_id, interest_rate, asked_duration_months)
     VALUES (?, ?, ?, ?)`,
    [req.user.id, loanId, rate, duration]
  );

  await pool.execute(
    `INSERT INTO notifications (user_id, title, description, onclick, notification_type)
     VALUES (?, ?, ?, ?, 'loan_offer')`,
    [loan.requester_id, 'New loan offer', `${req.user.name} sent you a loan offer`, `/loans/${loanId}/offers`]
  );

  res.status(201).json({ message: 'Offer sent', offer_id: result.insertId });
}

async function getLoanOffers(req, res) {
  const loanId = Number(req.params.id);
  const [loans] = await pool.execute('SELECT requester_id FROM loans WHERE id = ? LIMIT 1', [loanId]);
  if (!loans.length) return res.status(404).json({ message: 'Loan not found' });

  if (loans[0].requester_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the requester or admin can view all offers' });
  }

  const [offers] = await pool.execute(
    `SELECT lo.*, u.name AS offeror_name, u.username AS offeror_username,
            u.is_verified AS offeror_verified
     FROM loan_offers lo
     JOIN users u ON u.id = lo.offeror_id
     WHERE lo.loan_id = ?
     ORDER BY lo.offered_at DESC`,
    [loanId]
  );

  res.json({ offers });
}

async function myOffers(req, res) {
  const [rows] = await pool.execute(
    `SELECT lo.*, l.amount, l.description, l.requester_id,
            u.name AS requester_name, u.username AS requester_username
     FROM loan_offers lo
     JOIN loans l ON l.id = lo.loan_id
     JOIN users u ON u.id = l.requester_id
     WHERE lo.offeror_id = ? ORDER BY lo.offered_at DESC`,
    [req.user.id]
  );
  res.json({ offers: rows });
}

async function acceptOffer(req, res) {
  const offerId = Number(req.params.offerId);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [offerRows] = await conn.execute(
      `SELECT lo.*, l.requester_id, l.amount, l.installment, l.status AS loan_status, l.interest_allowed
       FROM loan_offers lo
       JOIN loans l ON l.id = lo.loan_id
       WHERE lo.id = ? FOR UPDATE`,
      [offerId]
    );

    if (!offerRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Offer not found' });
    }

    const offer = offerRows[0];
    if (offer.requester_id !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ message: 'Only the loan requester can accept this offer' });
    }
    if (offer.loan_status !== 'open' || offer.status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ message: 'This offer cannot be accepted' });
    }

    const [providerRows] = await conn.execute('SELECT id, name, balance FROM users WHERE id = ? FOR UPDATE', [offer.offeror_id]);
    const [borrowerRows] = await conn.execute('SELECT id, name, balance FROM users WHERE id = ? FOR UPDATE', [offer.requester_id]);

    const provider = providerRows[0];
    const borrower = borrowerRows[0];
    const principal = Number(offer.amount);

    if (Number(provider.balance) < principal) {
      await conn.rollback();
      return res.status(400).json({ message: 'Provider no longer has sufficient balance' });
    }

    const interestRate = Number(offer.interest_rate);
    const totalPayable = Number((principal + principal * interestRate / 100).toFixed(2));

    await conn.execute('UPDATE users SET balance = balance - ? WHERE id = ?', [principal, provider.id]);
    await conn.execute('UPDATE users SET balance = balance + ? WHERE id = ?', [principal, borrower.id]);

    await conn.execute(`UPDATE loan_offers SET status = 'accepted', is_accepted = TRUE WHERE id = ?`, [offerId]);
    await conn.execute(`UPDATE loan_offers SET status = 'rejected' WHERE loan_id = ? AND id <> ? AND status = 'pending'`, [offer.loan_id, offerId]);
    await conn.execute(`UPDATE loans SET status = 'funded' WHERE id = ?`, [offer.loan_id]);

    const [provided] = await conn.execute(
      `INSERT INTO provided_loans
        (loan_id, loan_offer_id, provider_id, borrower_id, principal_amount, interest_rate,
         total_payable_amount, total_installments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [offer.loan_id, offerId, provider.id, borrower.id, principal, interestRate, totalPayable, offer.installment]
    );

    await addTransaction(conn, {
      userId: provider.id,
      title: `Loan provided to ${borrower.name}`,
      amount: principal,
      transactionType: 'loan_given',
      direction: 'debit',
      transactedTo: borrower.id,
      transactedFrom: provider.id,
      referenceType: 'provided_loan',
      referenceId: provided.insertId,
    });

    await addTransaction(conn, {
      userId: borrower.id,
      title: `Loan received from ${provider.name}`,
      amount: principal,
      transactionType: 'loan_received',
      direction: 'credit',
      transactedTo: borrower.id,
      transactedFrom: provider.id,
      referenceType: 'provided_loan',
      referenceId: provided.insertId,
    });

    await createNotification(conn, {
      userId: provider.id,
      title: 'Loan offer accepted',
      description: `${borrower.name} accepted your loan offer`,
      onclick: `/provided-loans/${provided.insertId}`,
      type: 'loan_offer_accepted',
    });

    await conn.commit();

    res.json({
      message: 'Offer accepted and loan funded',
      provided_loan_id: provided.insertId,
      principal_amount: principal,
      total_payable_amount: totalPayable,
    });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function borrowedLoans(req, res) {
  const [rows] = await pool.execute(
    `SELECT pl.*, u.name AS provider_name, u.username AS provider_username
     FROM provided_loans pl
     JOIN users u ON u.id = pl.provider_id
     WHERE pl.borrower_id = ? ORDER BY pl.provided_at DESC`,
    [req.user.id]
  );
  res.json({ provided_loans: rows });
}

async function providedLoans(req, res) {
  const [rows] = await pool.execute(
    `SELECT pl.*, u.name AS borrower_name, u.username AS borrower_username
     FROM provided_loans pl
     JOIN users u ON u.id = pl.borrower_id
     WHERE pl.provider_id = ? ORDER BY pl.provided_at DESC`,
    [req.user.id]
  );
  res.json({ provided_loans: rows });
}

async function getProvidedLoan(req, res) {
  const [rows] = await pool.execute(
    `SELECT pl.*, provider.name AS provider_name, provider.username AS provider_username,
            borrower.name AS borrower_name, borrower.username AS borrower_username
     FROM provided_loans pl
     JOIN users provider ON provider.id = pl.provider_id
     JOIN users borrower ON borrower.id = pl.borrower_id
     WHERE pl.id = ? LIMIT 1`,
    [req.params.id]
  );

  if (!rows.length) return res.status(404).json({ message: 'Provided loan not found' });
  const loan = rows[0];
  if (![loan.provider_id, loan.borrower_id].includes(req.user.id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const [repayments] = await pool.execute(
    'SELECT * FROM loan_repayments WHERE provided_loan_id = ? ORDER BY paid_at DESC',
    [loan.id]
  );

  res.json({ provided_loan: loan, repayments });
}

async function repayLoan(req, res) {
  const providedLoanId = Number(req.params.id);
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'A valid repayment amount is required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [loanRows] = await conn.execute(
      'SELECT * FROM provided_loans WHERE id = ? FOR UPDATE',
      [providedLoanId]
    );
    if (!loanRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Provided loan not found' });
    }

    const loan = loanRows[0];
    if (loan.borrower_id !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ message: 'Only the borrower can repay this loan' });
    }
    if (loan.status !== 'active') {
      await conn.rollback();
      return res.status(400).json({ message: 'This loan is not active' });
    }

    const [borrowerRows] = await conn.execute('SELECT id, name, balance FROM users WHERE id = ? FOR UPDATE', [loan.borrower_id]);
    const [providerRows] = await conn.execute('SELECT id, name, balance FROM users WHERE id = ? FOR UPDATE', [loan.provider_id]);
    const borrower = borrowerRows[0];
    const provider = providerRows[0];

    const remaining = Number((Number(loan.total_payable_amount) - Number(loan.paid_amount)).toFixed(2));
    if (amount > remaining) {
      await conn.rollback();
      return res.status(400).json({ message: `Maximum remaining payable amount is ${remaining}` });
    }
    if (Number(borrower.balance) < amount) {
      await conn.rollback();
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    await conn.execute('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, borrower.id]);
    await conn.execute('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, provider.id]);

    const nextInstallment = Math.min(Number(loan.completed_installments) + 1, Number(loan.total_installments));
    const [repayment] = await conn.execute(
      `INSERT INTO loan_repayments (provided_loan_id, payer_id, receiver_id, amount, installment_no)
       VALUES (?, ?, ?, ?, ?)`,
      [loan.id, borrower.id, provider.id, amount, nextInstallment]
    );

    const newPaid = Number((Number(loan.paid_amount) + amount).toFixed(2));
    const completed = newPaid >= Number(loan.total_payable_amount);

    await conn.execute(
      `UPDATE provided_loans
       SET paid_amount = ?, completed_installments = ?, status = ?, completed_at = ?
       WHERE id = ?`,
      [newPaid, nextInstallment, completed ? 'completed' : 'active', completed ? new Date() : null, loan.id]
    );

    if (completed) {
      await conn.execute(`UPDATE loans SET status = 'completed', is_completed = TRUE WHERE id = ?`, [loan.loan_id]);
    }

    await addTransaction(conn, {
      userId: borrower.id,
      title: `Loan repayment to ${provider.name}`,
      amount,
      transactionType: 'loan_repayment_sent',
      direction: 'debit',
      transactedTo: provider.id,
      transactedFrom: borrower.id,
      referenceType: 'loan_repayment',
      referenceId: repayment.insertId,
    });

    await addTransaction(conn, {
      userId: provider.id,
      title: `Loan repayment from ${borrower.name}`,
      amount,
      transactionType: 'loan_repayment_received',
      direction: 'credit',
      transactedTo: provider.id,
      transactedFrom: borrower.id,
      referenceType: 'loan_repayment',
      referenceId: repayment.insertId,
    });

    await createNotification(conn, {
      userId: provider.id,
      title: 'Loan repayment received',
      description: `${borrower.name} paid ${amount}`,
      onclick: `/provided-loans/${loan.id}`,
      type: 'loan_repayment',
    });

    await conn.commit();
    res.json({ message: completed ? 'Loan fully repaid' : 'Repayment successful', paid_amount: newPaid, remaining_amount: Math.max(0, Number(loan.total_payable_amount) - newPaid) });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = {
  createLoan, listLoans, getLoan, myLoanRequests,
  createOffer, getLoanOffers, myOffers, acceptOffer,
  borrowedLoans, providedLoans, getProvidedLoan, repayLoan,
};
