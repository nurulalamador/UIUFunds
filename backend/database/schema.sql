CREATE DATABASE IF NOT EXISTS uiuloans
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE uiuloans;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    uiuid VARCHAR(10) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_username (username),
    INDEX idx_users_email (email)
);


-- =========================================================
-- COMMUNITY POSTS
-- =========================================================

CREATE TABLE community_posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    poster_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,

    is_approved BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_community_posts_poster
        FOREIGN KEY (poster_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_community_posts_poster (poster_id),
    INDEX idx_community_posts_created (created_at)
);




CREATE TABLE community_post_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    post_id BIGINT UNSIGNED NOT NULL,

    media_type ENUM('image', 'video', 'audio', 'file') NOT NULL,

    media_blob LONGBLOB NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_community_media_post
        FOREIGN KEY (post_id)
        REFERENCES community_posts(id)
        ON DELETE CASCADE,

    INDEX idx_community_media_post (post_id)
);


CREATE TABLE community_post_reacts (
    post_id BIGINT UNSIGNED NOT NULL,
    reactor_id BIGINT UNSIGNED NOT NULL,

    reacted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (post_id, reactor_id),

    CONSTRAINT fk_community_reacts_post
        FOREIGN KEY (post_id)
        REFERENCES community_posts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_community_reacts_user
        FOREIGN KEY (reactor_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_community_reacts_user (reactor_id)
);


CREATE TABLE community_post_comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    post_id BIGINT UNSIGNED NOT NULL,
    commenter_id BIGINT UNSIGNED NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_community_comments_post
        FOREIGN KEY (post_id)
        REFERENCES community_posts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_community_comments_user
        FOREIGN KEY (commenter_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_community_comments_post (post_id),
    INDEX idx_community_comments_user (commenter_id)
);


CREATE TABLE IF NOT EXISTS reported_posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED NOT NULL,
    reporter_id BIGINT UNSIGNED NOT NULL,
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reported_posts_post
        FOREIGN KEY (post_id)
        REFERENCES community_posts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reported_posts_reporter
        FOREIGN KEY (reporter_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    UNIQUE KEY uq_reported_post_reporter (post_id, reporter_id),
    INDEX idx_reported_posts_post (post_id),
    INDEX idx_reported_posts_reported_at (reported_at)
);


-- =========================================================
-- LOAN REQUESTS
-- =========================================================

CREATE TABLE loans (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    requester_id BIGINT UNSIGNED NOT NULL,

    amount DECIMAL(15,2) NOT NULL,

    duration_months INT UNSIGNED NOT NULL,

    description TEXT NOT NULL,

    interest_allowed BOOLEAN NOT NULL DEFAULT TRUE,

    installment INT UNSIGNED NOT NULL DEFAULT 1,

    status ENUM(
        'open',
        'offer_accepted',
        'funded',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'open',

    is_completed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_loans_requester
        FOREIGN KEY (requester_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_loans_requester (requester_id),
    INDEX idx_loans_status (status),
    INDEX idx_loans_created (created_at)
);


-- =========================================================
-- LOAN OFFERS
-- =========================================================

CREATE TABLE loan_offers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    offeror_id BIGINT UNSIGNED NOT NULL,
    loan_id BIGINT UNSIGNED NOT NULL,

    interest_rate DECIMAL(7,4) NOT NULL DEFAULT 0.0000,

    asked_duration_months INT UNSIGNED NOT NULL,

    offered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'pending',
        'accepted',
        'rejected',
        'withdrawn'
    ) NOT NULL DEFAULT 'pending',

    is_accepted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_loan_offers_offeror
        FOREIGN KEY (offeror_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_loan_offers_loan
        FOREIGN KEY (loan_id)
        REFERENCES loans(id)
        ON DELETE CASCADE,

    UNIQUE KEY uq_loan_offeror (loan_id, offeror_id),

    INDEX idx_loan_offers_offeror (offeror_id),
    INDEX idx_loan_offers_loan (loan_id),
    INDEX idx_loan_offers_status (status)
);


-- =========================================================
-- PROVIDED LOANS
-- Accepted offer থেকে actual loan তৈরি হবে
-- =========================================================

CREATE TABLE provided_loans (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    loan_id BIGINT UNSIGNED NOT NULL,
    loan_offer_id BIGINT UNSIGNED NOT NULL,

    provider_id BIGINT UNSIGNED NOT NULL,
    borrower_id BIGINT UNSIGNED NOT NULL,

    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(7,4) NOT NULL DEFAULT 0.0000,

    total_payable_amount DECIMAL(15,2) NOT NULL,

    total_installments INT UNSIGNED NOT NULL DEFAULT 1,
    completed_installments INT UNSIGNED NOT NULL DEFAULT 0,

    paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    provided_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'active',
        'completed',
        'defaulted',
        'cancelled'
    ) NOT NULL DEFAULT 'active',

    completed_at TIMESTAMP NULL,

    CONSTRAINT fk_provided_loans_loan
        FOREIGN KEY (loan_id)
        REFERENCES loans(id),

    CONSTRAINT fk_provided_loans_offer
        FOREIGN KEY (loan_offer_id)
        REFERENCES loan_offers(id),

    CONSTRAINT fk_provided_loans_provider
        FOREIGN KEY (provider_id)
        REFERENCES users(id),

    CONSTRAINT fk_provided_loans_borrower
        FOREIGN KEY (borrower_id)
        REFERENCES users(id),

    UNIQUE KEY uq_provided_loan (loan_id),

    UNIQUE KEY uq_provided_offer (loan_offer_id),

    INDEX idx_provided_provider (provider_id),
    INDEX idx_provided_borrower (borrower_id),
    INDEX idx_provided_status (status)
);


-- =========================================================
-- LOAN REPAYMENTS
-- প্রতিবার borrower টাকা দিলে history থাকবে
-- =========================================================

CREATE TABLE loan_repayments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    provided_loan_id BIGINT UNSIGNED NOT NULL,

    payer_id BIGINT UNSIGNED NOT NULL,
    receiver_id BIGINT UNSIGNED NOT NULL,

    amount DECIMAL(15,2) NOT NULL,

    installment_no INT UNSIGNED NULL,

    paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_repayment_loan
        FOREIGN KEY (provided_loan_id)
        REFERENCES provided_loans(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_repayment_payer
        FOREIGN KEY (payer_id)
        REFERENCES users(id),

    CONSTRAINT fk_repayment_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users(id),

    INDEX idx_repayments_loan (provided_loan_id),
    INDEX idx_repayments_payer (payer_id),
    INDEX idx_repayments_paid_at (paid_at)
);


-- =========================================================
-- CROWDFUNDING
-- Admin approval required
-- =========================================================

CREATE TABLE crowdfundings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    posted_by BIGINT UNSIGNED NOT NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    image_blob LONGBLOB NOT NULL,

    target_amount DECIMAL(15,2) NOT NULL,

    raised_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    approval_status ENUM(
        'pending',
        'approved',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    is_approved BOOLEAN NOT NULL DEFAULT FALSE,

    status ENUM(
        'active',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_crowdfundings_user
        FOREIGN KEY (posted_by)
        REFERENCES users(id),

    INDEX idx_crowdfunding_user (posted_by),
    INDEX idx_crowdfunding_approval (approval_status),
    INDEX idx_crowdfunding_status (status)
);


-- =========================================================
-- CROWDFUNDING DONATIONS
-- =========================================================

CREATE TABLE crowdfunding_donations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    crowdfunding_id BIGINT UNSIGNED NOT NULL,
    donor_id BIGINT UNSIGNED NOT NULL,

    amount DECIMAL(15,2) NOT NULL,

    donated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_donation_crowdfunding
        FOREIGN KEY (crowdfunding_id)
        REFERENCES crowdfundings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_donation_donor
        FOREIGN KEY (donor_id)
        REFERENCES users(id),

    INDEX idx_donation_crowdfunding (crowdfunding_id),
    INDEX idx_donation_donor (donor_id),
    INDEX idx_donation_date (donated_at)
);


-- =========================================================
-- CROWDFUNDING SPENDING
-- crowdfunding owner কোথায় টাকা খরচ করেছে
-- =========================================================

CREATE TABLE crowdfunding_spend_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    crowdfunding_id BIGINT UNSIGNED NOT NULL,

    name VARCHAR(255) NOT NULL,

    description TEXT NULL,

    price_per_unit DECIMAL(15,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,

    total_amount DECIMAL(15,2)
        GENERATED ALWAYS AS (price_per_unit * quantity) STORED,

    proof_type ENUM(
        'image',
        'pdf',
        'receipt',
        'other'
    ) NULL,

    proof_mime_type VARCHAR(50),
    proof_file_name VARCHAR(50),

    proof_blob LONGBLOB NULL,

    spent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_crowdfunding_spend
        FOREIGN KEY (crowdfunding_id)
        REFERENCES crowdfundings(id)
        ON DELETE CASCADE,

    INDEX idx_crowdfunding_spend_campaign (crowdfunding_id)
);


-- =========================================================
-- TRANSACTIONS
-- সমস্ত wallet movement / financial ledger
-- =========================================================

CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(255) NOT NULL,

    amount DECIMAL(15,2) NOT NULL,

    transaction_type ENUM(
        'deposit',
        'withdrawal',
        'loan_given',
        'loan_received',
        'loan_repayment_sent',
        'loan_repayment_received',
        'crowdfunding_donation',
        'crowdfunding_received',
        'refund',
        'adjustment'
    ) NOT NULL,

    direction ENUM(
        'credit',
        'debit'
    ) NOT NULL,

    transacted_to BIGINT UNSIGNED NULL,
    transacted_from BIGINT UNSIGNED NULL,

    reference_type ENUM(
        'loan',
        'loan_offer',
        'provided_loan',
        'loan_repayment',
        'crowdfunding',
        'crowdfunding_donation',
        'other'
    ) NULL,

    reference_id BIGINT UNSIGNED NULL,

    status ENUM(
        'pending',
        'completed',
        'failed',
        'cancelled'
    ) NOT NULL DEFAULT 'completed',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_transactions_to
        FOREIGN KEY (transacted_to)
        REFERENCES users(id),

    CONSTRAINT fk_transactions_from
        FOREIGN KEY (transacted_from)
        REFERENCES users(id),

    INDEX idx_transactions_user (user_id),
    INDEX idx_transactions_created (created_at),
    INDEX idx_transactions_reference (reference_type, reference_id),
    INDEX idx_transactions_status (status)
);


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT NULL,

    onclick VARCHAR(500) NULL,

    notification_type ENUM(
        'general',
        'loan_offer',
        'loan_offer_accepted',
        'loan_repayment',
        'crowdfunding',
        'community'
    ) NOT NULL DEFAULT 'general',

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (user_id, is_read),
    INDEX idx_notifications_created (created_at)
);

-- =========================================================
-- MESSAGES
-- =========================================================

CREATE TABLE messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    sender_id BIGINT UNSIGNED NOT NULL,
    receiver_id BIGINT UNSIGNED NOT NULL,

    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,

    CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_messages_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_receiver (receiver_id),
    INDEX idx_messages_conversation (sender_id, receiver_id, sent_at),
    INDEX idx_messages_unread (receiver_id, is_read)
);


