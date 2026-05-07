CREATE TABLE IF NOT EXISTS email_logs
(
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient     VARCHAR(255) NOT NULL,
    template_id   VARCHAR(255) NOT NULL,
    status        VARCHAR(50)  NOT NULL,
    error_message TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at       TIMESTAMP
);
