async function addTransaction(conn, {
  userId,
  title,
  amount,
  transactionType,
  direction,
  transactedTo = null,
  transactedFrom = null,
  referenceType = null,
  referenceId = null,
  status = 'completed',
}) {
  const [result] = await conn.execute(
    `INSERT INTO transactions
      (user_id, title, amount, transaction_type, direction,
       transacted_to, transacted_from, reference_type, reference_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId, title, amount, transactionType, direction,
      transactedTo, transactedFrom, referenceType, referenceId, status,
    ]
  );

  return result.insertId;
}

module.exports = { addTransaction };
