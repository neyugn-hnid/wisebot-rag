-- ===============================
-- TENANT INVITES
-- ===============================
CREATE TABLE tenant_invites
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID        NOT NULL,
    email       VARCHAR(255) NOT NULL,
    token       VARCHAR(64)  NOT NULL UNIQUE,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    expires_at  TIMESTAMP,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,

    CONSTRAINT fk_tenant_invites_tenant
        FOREIGN KEY (tenant_id)
            REFERENCES tenants (id)
            ON DELETE CASCADE
);

CREATE INDEX idx_tenant_invites_token ON tenant_invites (token);
CREATE INDEX idx_tenant_invites_tenant_email ON tenant_invites (tenant_id, email);
