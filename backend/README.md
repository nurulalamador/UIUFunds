# UIULoans Backend

Simple backend for UIULoans using:

- Node.js 18+
- Express.js 5
- MySQL / XAMPP phpMyAdmin
- mysql2
- JWT authentication
- bcryptjs password hashing
- Multer memory upload -> MySQL LONGBLOB

## 1. XAMPP setup

1. Open XAMPP Control Panel.
2. Start **MySQL**.
3. Open `http://localhost/phpmyadmin`.
4. Go to **Import**.
5. Import `database/schema.sql`.

The script creates a database named `uiuloans` and all required tables.

> WARNING: `schema.sql` drops the UIULoans tables first. Use it for initial/local setup. Do not re-import it over production data.

## 2. Backend setup

```bash
npm install
```

Copy `.env.example` to `.env`.

Windows CMD:

```cmd
copy .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Typical XAMPP config:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=uiuloans
```

Change `JWT_SECRET` to a long random value.

Start:

```bash
npm run dev
```

API:

```text
http://localhost:5000
```

## 3. Authorization

Protected routes require:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Registration and login return the token.

## 4. Make an admin

Register normally, then run in phpMyAdmin SQL:

```sql
UPDATE users
SET role = 'admin', is_verified = 1
WHERE email = 'your@email.com';
```

## 5. Main endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Register body:

```json
{
  "name": "Test User",
  "username": "testuser",
  "email": "test@example.com",
  "password": "12345678"
}
```

Login accepts username or email:

```json
{
  "identifier": "testuser",
  "password": "12345678"
}
```

### Profile

- `GET /api/profile/me`
- `PATCH /api/profile/me`
- `PATCH /api/profile/me/password`
- `GET /api/profile/:username`

### Transactions / wallet

- `GET /api/transactions`
- `POST /api/transactions/demo-topup`

Demo top-up body:

```json
{
  "amount": 100000
}
```

`demo-topup` is only to make localhost testing easy. Disable it in production:

```env
ENABLE_DEMO_TOPUP=false
```

### Loans

- `GET /api/loans`
- `GET /api/loans/:id`
- `POST /api/loans`
- `GET /api/loans/mine/requests`
- `POST /api/loans/:id/offers`
- `GET /api/loans/:id/offers` - requester/admin
- `GET /api/loans/mine/offers`
- `PATCH /api/loans/offers/:offerId/accept`
- `GET /api/loans/mine/borrowed`
- `GET /api/loans/mine/provided`
- `GET /api/loans/provided/:id`
- `POST /api/loans/provided/:id/repay`

Create loan:

```json
{
  "amount": 50000,
  "duration_months": 12,
  "description": "Need money for education expenses",
  "interest_allowed": true,
  "installment": 10
}
```

Create offer:

```json
{
  "interest_rate": 8,
  "asked_duration_months": 12
}
```

Current implementation treats `interest_rate` as a **flat percentage for the whole loan**.

Example: principal 50,000 + 8% = total payable 54,000.

Repay:

```json
{
  "amount": 5400
}
```

Loan acceptance and repayment use MySQL transactions + row locking so wallet balances and transaction history are changed together.

### Crowdfunding

- `GET /api/crowdfundings`
- `GET /api/crowdfundings/:id`
- `POST /api/crowdfundings`
- `GET /api/crowdfundings/mine`
- `GET /api/crowdfundings/admin/pending` - admin
- `PATCH /api/crowdfundings/admin/:id/approve` - admin
- `PATCH /api/crowdfundings/admin/:id/reject` - admin
- `POST /api/crowdfundings/:id/donate`
- `POST /api/crowdfundings/:id/spend-items`
- `GET /api/crowdfundings/spend/:spendId/proof`

Create crowdfunding:

```json
{
  "name": "Help with treatment",
  "description": "Campaign details...",
  "target_amount": 100000
}
```

Donation:

```json
{
  "amount": 1000
}
```

Spend item uses `multipart/form-data`:

```text
name = Medicine
price_per_unit = 500
quantity = 4
description = Medicine purchase
proof = [file]
```

Proof is stored as `LONGBLOB` in MySQL.

### Community

- `GET /api/community/posts`
- `GET /api/community/posts/:id`
- `POST /api/community/posts`
- `GET /api/community/media/:mediaId`
- `POST /api/community/posts/:id/react`
- `POST /api/community/posts/:id/comments`

Create post uses `multipart/form-data`:

```text
content = I need advice about...
media = [optional file]
media = [optional second file]
```

Maximum 4 files, 5 MB each.

### Notifications

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

## 6. Basic loan flow

1. User A creates a loan request. No admin approval.
2. User B adds enough demo wallet balance.
3. User B sends an offer.
4. User A views offers and accepts B's offer.
5. The loan amount moves B -> A.
6. A `provided_loans` row is created.
7. Both users get transaction history entries.
8. User A repays using `/api/loans/provided/:id/repay`.
9. Repayment moves A -> B and creates `loan_repayments` history.
10. When paid amount reaches total payable, the loan becomes completed.

## 7. Basic crowdfunding flow

1. User creates crowdfunding -> pending.
2. Admin approves it.
3. Other users donate from wallet.
4. Donation amount moves donor -> campaign owner.
5. Owner records spend items and optional proof BLOB.
6. Total recorded spend cannot exceed raised amount.

## 8. Important production notes

This is intentionally a simple MVP backend. Before real-money production use, add at least:

- Payment gateway / verified deposits and withdrawals
- Email verification and password reset
- Refresh token / session revocation
- Rate limiting
- Request validation library
- Audit logs
- Idempotency keys for financial endpoints
- Stronger authorization rules
- KYC / identity verification
- Loan/crowdfunding legal and compliance review
- Object storage instead of large DB BLOBs when the app grows
- Database migrations instead of re-running `schema.sql`
