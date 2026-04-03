-- ===============================
-- EXTENSION
-- ===============================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================
-- TENANTS
-- ===============================
CREATE TABLE tenants
(
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL UNIQUE,
    plan       VARCHAR(50),
    created_at TIMESTAMP        DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- USERS
-- ===============================
CREATE TABLE users
(
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID         NOT NULL,
    username          VARCHAR(100) NOT NULL UNIQUE,
    email             VARCHAR(150) NOT NULL UNIQUE,
    password          VARCHAR(255) NOT NULL,
    full_name         VARCHAR(150),
    avatar_url        TEXT,
    phone             VARCHAR(20),
    status            VARCHAR(20)      DEFAULT 'ACTIVE',
    is_email_verified BOOLEAN          DEFAULT false,
    login_provider    VARCHAR(20)      DEFAULT 'LOCAL',
    last_login        TIMESTAMP,
    created_at        TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_tenant
        FOREIGN KEY (tenant_id)
            REFERENCES tenants (id)
            ON DELETE CASCADE
);

-- ===============================
-- ROLES
-- ===============================
CREATE TABLE roles
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- ===============================
-- PERMISSIONS
-- ===============================
CREATE TABLE permissions
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ===============================
-- USER_ROLES
-- ===============================
CREATE TABLE user_roles
(
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id)
            REFERENCES roles (id)
            ON DELETE CASCADE
);

-- ===============================
-- ROLE_PERMISSIONS
-- ===============================
CREATE TABLE role_permissions
(
    role_id       UUID NOT NULL,
    permission_id UUID NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
            REFERENCES roles (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id)
            REFERENCES permissions (id)
            ON DELETE CASCADE
);

-- ===============================
-- INDEXES (QUAN TRỌNG)
-- ===============================
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_tenant ON users (tenant_id);

CREATE INDEX idx_user_roles_user ON user_roles (user_id);
CREATE INDEX idx_user_roles_role ON user_roles (role_id);

CREATE INDEX idx_role_permissions_role ON role_permissions (role_id);

-- ===============================
-- AUDIT LOG
-- ===============================
CREATE TABLE audit_logs
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    action      VARCHAR(100),
    resource    VARCHAR(100),
    method      VARCHAR(10),
    endpoint    TEXT,
    ip_address  VARCHAR(50),
    user_agent  TEXT,
    status_code INT,
    created_at  TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE SET NULL
);

-- ===============================
-- API USAGE
-- ===============================
CREATE TABLE api_usage
(
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID,
    endpoint      VARCHAR(255),
    request_count INT              DEFAULT 1,
    last_request  TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_api_user
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE SET NULL
);

-- ===============================
-- JWT BLACKLIST
-- ===============================
CREATE TABLE blacklisted_tokens
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token       TEXT      NOT NULL,
    expiry_date TIMESTAMP NOT NULL
);