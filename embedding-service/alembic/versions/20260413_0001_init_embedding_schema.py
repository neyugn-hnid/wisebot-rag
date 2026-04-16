"""init embedding_service schema

Revision ID: 20260413_0001
Revises:
Create Date: 2026-04-13
"""

from alembic import op


revision = "20260413_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE SCHEMA IF NOT EXISTS embedding_service")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS embedding_service.embedding_collections (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            embedding_model VARCHAR(255) NOT NULL,
            dimension INTEGER NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (tenant_id, name)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS embedding_service.embedding_jobs (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            collection_id UUID NOT NULL,
            source_document_id UUID,
            source_chunk_count INTEGER,
            processed_chunk_count INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(32) NOT NULL,
            error_message TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_embedding_jobs_collection
                FOREIGN KEY (collection_id)
                REFERENCES embedding_service.embedding_collections(id)
                ON DELETE CASCADE
        )
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS embedding_service.embeddings (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            collection_id UUID NOT NULL,
            source_document_id UUID,
            source_chunk_id UUID,
            chunk_index INTEGER,
            chunk_text TEXT NOT NULL,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            embedding vector NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_embeddings_collection
                FOREIGN KEY (collection_id)
                REFERENCES embedding_service.embedding_collections(id)
                ON DELETE CASCADE
        )
        """
    )

    op.execute("CREATE INDEX IF NOT EXISTS idx_embedding_collections_tenant ON embedding_service.embedding_collections (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_embedding_jobs_tenant_created ON embedding_service.embedding_jobs (tenant_id, created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_embedding_jobs_collection ON embedding_service.embedding_jobs (collection_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_embeddings_collection ON embedding_service.embeddings (collection_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_embeddings_tenant_collection ON embedding_service.embeddings (tenant_id, collection_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_embeddings_source_document ON embedding_service.embeddings (source_document_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS embedding_service.embeddings")
    op.execute("DROP TABLE IF EXISTS embedding_service.embedding_jobs")
    op.execute("DROP TABLE IF EXISTS embedding_service.embedding_collections")
    op.execute("DROP SCHEMA IF EXISTS embedding_service")
