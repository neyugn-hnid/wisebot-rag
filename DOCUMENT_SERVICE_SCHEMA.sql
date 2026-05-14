-- PostgreSQL schema for document-service
-- Source: document-service/src/main/resources/db/migration
-- Normalized to the current entity model used by the service

CREATE TABLE knowledge_bases
(
    id          UUID PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id   UUID,
    created_at  TIMESTAMP
);

CREATE TABLE documents
(
    id                UUID PRIMARY KEY,
    knowledge_base_id UUID,
    filename          VARCHAR(255) NOT NULL,
    content_type      VARCHAR(100),
    file_size         BIGINT,
    storage_path      VARCHAR(500),
    status            VARCHAR(20) NOT NULL DEFAULT 'UPLOADED',
    created_at        TIMESTAMP,

    CONSTRAINT fk_documents_knowledge_base
        FOREIGN KEY (knowledge_base_id)
            REFERENCES knowledge_bases (id)
);

CREATE TABLE document_chunks
(
    id           UUID PRIMARY KEY,
    document_id  UUID NOT NULL,
    chunk_index  INT NOT NULL,
    content      TEXT,
    embedding_id VARCHAR(200),
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMP,

    CONSTRAINT fk_document_chunks_document
        FOREIGN KEY (document_id)
            REFERENCES documents (id)
);
