# UIUFund Frontend (Vite + React)

React implementation of the supplied UIUFund design, connected to the previously created Express.js + MySQL UIULoans backend.

## Stack

- Vite
- React 18
- React Router DOM
- Plain CSS
- Lucide React icons
- Fetch API
- JWT token stored in `localStorage`

## Public routes

Only these pages are public:

- `/` — Landing page
- `/login` — Login
- `/signup` — Registration
- `/about` — About

All `/app/*` pages are protected. If a visitor is not logged in, React Router redirects them to `/login` and returns them to the requested route after successful login.

## Protected routes

- `/app` — Dashboard
- `/app/community` — Community feed
- `/app/loans` — Explore loan requests
- `/app/loans/new` — Post loan request
- `/app/loans/:loanId/offers` — Offers received for a loan
- `/app/my-loans` — My requested/received loans
- `/app/provided-loans` — Loans I provided
- `/app/provided-loans/:id` — Loan details / repayment
- `/app/crowdfundings` — Current approved crowdfundings
- `/app/crowdfundings/new` — Post crowdfunding
- `/app/my-crowdfundings` — My campaigns
- `/app/crowdfundings/:id/manage-spent` — Manage spent items
- `/app/crowdfundings/history` — Completed crowdfunding history
- `/app/crowdfundings/:id/spent` — Read-only spent history
- `/app/transactions` — Wallet/transaction history
- `/app/notifications` — Notifications
- `/app/profile` — Profile
- `/app/settings` — Password/settings
- `/app/messages` — Protected placeholder; backend currently has no message endpoints
- `/app/admin/crowdfundings` — Admin-only crowdfunding approval screen

## Requested design changes included

1. Language selector was removed from the landing page/header.
2. Login page does not contain a language selector.
3. The Send Loan Offer modal asks for:
   - Interest Rate (%)
   - Proposed Duration (months)
4. Proposed duration is sent to the backend as `asked_duration_months`.
5. Protected routing prevents logged-out visitors from opening loan, crowdfunding, transaction, profile, dashboard, community or account screens.

## Backend connection

Create `.env` from `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

The frontend expects the Express backend to run at `http://localhost:5000`.

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Auth flow

Login request:

```text
POST /api/auth/login
```

Registration:

```text
POST /api/auth/register
```

The returned JWT is stored as:

```text
uiufund_token
```

The cached user is stored as:

```text
uiufund_user
```

Protected API requests automatically send:

```http
Authorization: Bearer YOUR_TOKEN
```

## Backend compatibility notes

The frontend follows the current backend API. A few visual elements exist in the supplied UI but are not currently represented by backend columns/endpoints:

### Loan title / priority

The current `loans` table does not have `title` or `priority` columns. The Post Loan Request UI still includes them to match the design. The title is prepended to `description`; priority is currently visual-only.

### Crowdfunding campaign image and campaign-level proof

The supplied UI contains campaign image/proof fields, but the current `crowdfundings` table/backend create endpoint only accepts:

```json
{
  "name": "...",
  "description": "...",
  "target_amount": 10000
}
```

Therefore the image/proof picker is included visually, but those files are not submitted to the current backend. Crowdfunding **spent-item proof files are fully connected** and are uploaded as `LONGBLOB` through the existing spend-item endpoint.

### Messages

The design includes Messages in the sidebar. The existing backend does not have a messaging table/API, so the route is protected and shows a placeholder rather than inventing a non-existent API.

## Local wallet top-up

For development, the Transactions page can call:

```text
POST /api/transactions/demo-topup
```

This requires this backend setting:

```env
ENABLE_DEMO_TOPUP=true
```

Disable it in production.

## Branding

The visual design uses `UIUFund`, so the frontend follows that branding. The backend/database can continue to be named `UIULoans`; they do not need to have the same internal project name.
