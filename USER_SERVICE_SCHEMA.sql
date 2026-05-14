-- PostgreSQL schema for user-service
-- Source: user-service/src/main/resources/db/migration

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants
(
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL UNIQUE,
    plan       VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users
(
    id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                     UUID NOT NULL,
    username                      VARCHAR(100) NOT NULL UNIQUE,
    email                         VARCHAR(150) NOT NULL UNIQUE,
    password                      VARCHAR(255) NOT NULL,
    full_name                     VARCHAR(150),
    avatar_url                    TEXT,
    phone                         VARCHAR(20),
    status                        VARCHAR(20) DEFAULT 'ACTIVE',
    is_email_verified             BOOLEAN DEFAULT false,
    login_provider                VARCHAR(20) DEFAULT 'LOCAL',
    last_login                    TIMESTAMP,
    email_verification_token      VARCHAR(255),
    email_verification_expires_at TIMESTAMP,
    password_reset_token          VARCHAR(255),
    password_reset_expires_at     TIMESTAMP,
    created_at                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_tenant
        FOREIGN KEY (tenant_id)
            REFERENCES tenants (id)
            ON DELETE CASCADE
);

CREATE TABLE roles
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE permissions
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

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
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE SET NULL
);

CREATE TABLE api_usage
(
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID,
    endpoint      VARCHAR(255),
    request_count INT DEFAULT 1,
    last_request  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_api_user
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE SET NULL
);

CREATE TABLE blacklisted_tokens
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token       TEXT NOT NULL,
    expiry_date TIMESTAMP NOT NULL
);

CREATE TABLE tenant_invites
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    email       VARCHAR(255) NOT NULL,
    token       VARCHAR(64) NOT NULL UNIQUE,
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at  TIMESTAMP,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,

    CONSTRAINT fk_tenant_invites_tenant
        FOREIGN KEY (tenant_id)
            REFERENCES tenants (id)
            ON DELETE CASCADE
);

CREATE TABLE email_logs
(
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient     VARCHAR(200) NOT NULL,
    template_id   VARCHAR(100),
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    sent_at       TIMESTAMP,
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_tenant ON users (tenant_id);
CREATE INDEX idx_users_password_reset_token ON users (password_reset_token);

CREATE INDEX idx_user_roles_user ON user_roles (user_id);
CREATE INDEX idx_user_roles_role ON user_roles (role_id);

CREATE INDEX idx_role_permissions_role ON role_permissions (role_id);

CREATE INDEX idx_tenant_invites_token ON tenant_invites (token);
CREATE INDEX idx_tenant_invites_tenant_email ON tenant_invites (tenant_id, email);

CREATE INDEX idx_email_logs_recipient ON email_logs (recipient);
CREATE INDEX idx_email_logs_status ON email_logs (status);
