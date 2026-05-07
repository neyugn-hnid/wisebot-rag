DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'email_verification_token'
    ) THEN
        EXECUTE 'ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255)';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'email_verification_expires_at'
    ) THEN
        EXECUTE 'ALTER TABLE users ADD COLUMN email_verification_expires_at TIMESTAMP';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND tablename = 'users'
          AND indexname = 'idx_users_email_verification_token'
    ) THEN
        EXECUTE 'CREATE INDEX idx_users_email_verification_token ON users (email_verification_token)';
    END IF;
END $$;