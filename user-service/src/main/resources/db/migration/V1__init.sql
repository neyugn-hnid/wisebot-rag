-- ===============================
-- EXTENSION
-- ===============================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================
-- TENANTS
-- ===============================
CREATE TABLE
    tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        name VARCHAR(255) NOT NULL UNIQUE,
        plan VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===============================
-- USERS
-- ===============================
CREATE TABLE
    users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        tenant_id UUID NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(150),
        avatar_url TEXT,
        phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        is_email_verified BOOLEAN DEFAULT false,
        email_verification_token VARCHAR(255),
        email_verification_expires_at TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires_at TIMESTAMP,
        login_provider VARCHAR(20) DEFAULT 'LOCAL',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    );

-- ===============================
-- ROLES
-- ===============================
CREATE TABLE
    roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT
    );

-- ===============================
-- PERMISSIONS
-- ===============================
CREATE TABLE
    permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT
    );

-- ===============================
-- USER_ROLES
-- ===============================
CREATE TABLE
    user_roles (
        user_id UUID NOT NULL,
        role_id UUID NOT NULL,
        PRIMARY KEY (user_id, role_id),
        CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
    );

-- ===============================
-- ROLE_PERMISSIONS
-- ===============================
CREATE TABLE
    role_permissions (
        role_id UUID NOT NULL,
        permission_id UUID NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
        CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
    );

-- ===============================
-- INDEXES (QUAN TRỌNG)
-- ===============================
CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_users_username ON users (username);

CREATE INDEX idx_users_tenant ON users (tenant_id);

CREATE INDEX idx_users_email_verification_token ON users (email_verification_token);

CREATE INDEX idx_users_password_reset_token ON users (password_reset_token);

CREATE INDEX idx_user_roles_user ON user_roles (user_id);

CREATE INDEX idx_user_roles_role ON user_roles (role_id);

CREATE INDEX idx_role_permissions_role ON role_permissions (role_id);

-- ===============================
-- AUDIT LOG
-- ===============================
CREATE TABLE
    audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID,
        action VARCHAR(100),
        resource VARCHAR(100),
        method VARCHAR(10),
        endpoint TEXT,
        ip_address VARCHAR(50),
        user_agent TEXT,
        status_code INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );

-- ===============================
-- API USAGE
-- ===============================
CREATE TABLE
    api_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID,
        endpoint VARCHAR(255),
        request_count INT DEFAULT 1,
        last_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_api_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );

-- ===============================
-- JWT BLACKLIST
-- ===============================
CREATE TABLE
    blacklisted_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        token TEXT NOT NULL,
        expiry_date TIMESTAMP NOT NULL
    );

-- ===============================
-- TENANT INVITES
-- ===============================
CREATE TABLE
    tenant_invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        tenant_id UUID NOT NULL,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP,
        CONSTRAINT fk_tenant_invites_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    );

CREATE INDEX idx_tenant_invites_token ON tenant_invites (token);

CREATE INDEX idx_tenant_invites_tenant_email ON tenant_invites (tenant_id, email);

-- ===============================
-- EMAIL LOGS
-- ===============================
CREATE TABLE
    email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        recipient VARCHAR(200) NOT NULL,
        template_id VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        error_message TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX idx_email_logs_recipient ON email_logs (recipient);

CREATE INDEX idx_email_logs_status ON email_logs (status);

-- ===============================
-- SYSTEM SETTINGS
-- ===============================
CREATE TABLE
    system_settings (
        id UUID PRIMARY KEY,
        setting_key VARCHAR(120) NOT NULL UNIQUE,
        setting_value TEXT NOT NULL,
        description VARCHAR(255),
        updated_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX idx_system_settings_key ON system_settings (setting_key);

-- ===============================
-- SEED ROLES
-- ===============================
INSERT INTO
    roles (name, description)
VALUES
    ('ADMIN', 'Administrator'),
    ('USER', 'Normal user'),
    ('OWNER', 'Tenant owner') ON CONFLICT (name) DO NOTHING;

-- ===============================
-- SEED PERMISSIONS
-- ===============================
INSERT INTO
    permissions (name, description)
VALUES
    ('READ', 'Read access'),
    ('WRITE', 'Write access'),
    ('DELETE', 'Delete access') ON CONFLICT (name) DO NOTHING;

-- ===============================
-- SEED TENANT
-- ===============================
INSERT INTO
    tenants (id, name, plan)
VALUES
    (
        '33f0dc52-44da-4410-ac20-feb4f5578316',
        'Wisebot Demo',
        'PRO'
    ) ON CONFLICT (name) DO NOTHING;

-- ===============================
-- SEED ADMIN USER
-- ===============================
INSERT INTO
    users (
        id,
        tenant_id,
        username,
        email,
        password,
        full_name,
        avatar_url,
        phone,
        status,
        is_email_verified,
        email_verification_token,
        email_verification_expires_at,
        password_reset_token,
        password_reset_expires_at,
        login_provider,
        last_login,
        created_at,
        updated_at
    )
VALUES
    (
        '556d8d6a-e1c1-4fc5-9683-2242aa293a29',
        '33f0dc52-44da-4410-ac20-feb4f5578316',
        'admin',
        'admin@wisebot.com',
        '$2a$12$Fmd3UXPB3KjyHGW7v0EaMexwry3NpVCA3cJ2P6BzZ/kGJr11TCW8C',
        'Admin User',
        NULL,
        NULL,
        'ACTIVE',
        true,
        NULL,
        NULL,
        NULL,
        NULL,
        'LOCAL',
        NULL,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (email) DO NOTHING;

-- ===============================
-- SEED USER ROLE
-- ===============================
INSERT INTO
    user_roles (user_id, role_id)
SELECT
    u.id,
    r.id
FROM
    users u,
    roles r
WHERE
    u.username = 'admin'
    AND r.name = 'ADMIN' ON CONFLICT (user_id, role_id) DO NOTHING;

-- ===============================
-- SEED ROLE PERMISSIONS
-- ===============================
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM
    roles r,
    permissions p
WHERE
    r.name = 'ADMIN' ON CONFLICT (role_id, permission_id) DO NOTHING;