-- ===============================
-- KNOWLEDGE BASES
-- ===============================
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID,
    created_at TIMESTAMP
);

-- ===============================
-- DOCUMENTS
-- ===============================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT,
    storage_key VARCHAR(500),
    knowledge_base_id UUID REFERENCES knowledge_bases(id),
    storage_path VARCHAR(500),
    status VARCHAR(20),
    created_at TIMESTAMP
);

-- ===============================
-- DOCUMENT CHUNKS
-- ===============================
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT,
    embedding_id VARCHAR(200),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP,
    CONSTRAINT fk_document_chunks_document
        FOREIGN KEY (document_id) REFERENCES documents(id)
);
