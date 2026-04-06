CREATE TABLE IF NOT EXISTS knowledge_bases (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID,
    created_at TIMESTAMP
);

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS knowledge_base_id UUID,
    ADD COLUMN IF NOT EXISTS storage_path VARCHAR(500),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20);

ALTER TABLE documents
    ADD CONSTRAINT fk_documents_knowledge_base
    FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id);

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
