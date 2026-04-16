CREATE SCHEMA IF NOT EXISTS chat_service;
SET search_path TO chat_service, public;

CREATE TABLE IF NOT EXISTS chat_sessions
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    widget_id UUID,
    channel VARCHAR(20) NOT NULL DEFAULT 'WEB',
    title VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    sender_id UUID,
    role VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    content TEXT,
    content_json JSONB,
    model_name VARCHAR(120),
    input_tokens INT,
    output_tokens INT,
    latency_ms INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_message_citations
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    source_type VARCHAR(20) NOT NULL,
    source_document_id UUID,
    source_chunk_id UUID,
    source_url TEXT,
    score NUMERIC(6,5),
    snippet TEXT
);

CREATE TABLE IF NOT EXISTS chat_message_feedback
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID,
    rating SMALLINT NOT NULL,
    reason VARCHAR(100),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_tenant_user ON chat_sessions (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_widget ON chat_sessions (widget_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant_created ON chat_messages (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_citations_message ON chat_message_citations (message_id);
