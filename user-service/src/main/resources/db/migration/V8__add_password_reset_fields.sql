-- V7: Add password reset OTP fields
DO $$
BEGIN
    -- Add password_reset_token column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'password_reset_token'
    ) THEN
        EXECUTE 'ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255)';
    END IF;

    -- Add password_reset_expires_at column
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'password_reset_expires_at'
    ) THEN
        EXECUTE 'ALTER TABLE users ADD COLUMN password_reset_expires_at TIMESTAMP';
    END IF;

    -- Add index on password_reset_token for OTP lookup
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'users'
          AND indexname = 'idx_users_password_reset_token'
    ) THEN
        EXECUTE 'CREATE INDEX idx_users_password_reset_token ON users (password_reset_token)';
    END IF;
END $$;
