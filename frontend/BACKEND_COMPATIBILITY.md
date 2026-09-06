# Optional backend additions for exact UI parity

The frontend is usable with the current backend without these changes. These are only needed if you want every field shown in the design to persist exactly.

## 1. Loan title and priority

Suggested columns:

```sql
ALTER TABLE loans
ADD COLUMN title VARCHAR(255) NULL AFTER requester_id,
ADD COLUMN priority ENUM('normal','urgent') NOT NULL DEFAULT 'normal' AFTER installment;
```

Then update the Express loan create endpoint to accept `title` and `priority`.

## 2. Crowdfunding cover image

Suggested columns:

```sql
ALTER TABLE crowdfundings
ADD COLUMN image_mime_type VARCHAR(100) NULL,
ADD COLUMN image_file_name VARCHAR(255) NULL,
ADD COLUMN image_blob LONGBLOB NULL;
```

Use Multer `memoryStorage()` on the crowdfunding create route and store the uploaded cover image as `LONGBLOB`.

## 3. Crowdfunding creation proofs

If campaign-level verification documents should be separate from spent-item proofs, use a separate table instead of adding many proof columns to `crowdfundings`:

```sql
CREATE TABLE crowdfunding_proofs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  crowdfunding_id BIGINT UNSIGNED NOT NULL,
  description VARCHAR(500) NULL,
  proof_type VARCHAR(50) NULL,
  mime_type VARCHAR(100) NULL,
  file_name VARCHAR(255) NULL,
  proof_blob LONGBLOB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crowdfunding_id) REFERENCES crowdfundings(id) ON DELETE CASCADE
);
```

## 4. Messaging

The current design has a Messages navigation item, but the existing backend has no messaging schema/endpoints. Add this module later if direct messaging is required.
