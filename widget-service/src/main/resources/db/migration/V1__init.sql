CREATE SCHEMA IF NOT EXISTS widget_service;
SET search_path TO widget_service, public;

-- ===============================
-- WIDGETS
-- ===============================
CREATE TABLE IF NOT EXISTS widgets
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(80) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    public_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    private_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    welcome_message TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, code)
);

-- ===============================
-- ALLOWED DOMAINS
-- ===============================
CREATE TABLE IF NOT EXISTS widget_allowed_domains
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    allow_subdomains BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (widget_id, domain)
);

-- ===============================
-- API KEYS
-- ===============================
CREATE TABLE IF NOT EXISTS widget_api_keys
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    key_prefix VARCHAR(20) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- SESSIONS
-- ===============================
CREATE TABLE IF NOT EXISTS widget_sessions
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    visitor_id VARCHAR(120),
    user_id UUID,
    source_url TEXT,
    referrer_url TEXT,
    ip_address VARCHAR(64),
    user_agent TEXT,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- ===============================
-- EVENTS
-- ===============================
CREATE TABLE IF NOT EXISTS widget_events
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    session_id UUID REFERENCES widget_sessions(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- INDEXES
-- ===============================
CREATE INDEX IF NOT EXISTS idx_widgets_tenant_status ON widgets (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_widget_domains_widget ON widget_allowed_domains (widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_sessions_widget_started ON widget_sessions (widget_id, started_at);
CREATE INDEX IF NOT EXISTS idx_widget_events_tenant_created ON widget_events (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_widget_events_type_created ON widget_events (event_type, created_at);
