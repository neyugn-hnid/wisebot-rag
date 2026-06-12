SET search_path TO widget_service, public;

CREATE TABLE IF NOT EXISTS widget_allowed_domains
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    allow_subdomains BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (widget_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_widget_allowed_domains_widget ON widget_allowed_domains (widget_id);
