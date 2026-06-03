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
    op.execute("CREATE SCHEMA IF NOT EXISTS embedding_service")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS embedding_service.embedding_collections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            knowledge_base_id UUID,
            name VARCHAR(255) NOT NULL,
            provider VARCHAR(255),
            model_name VARCHAR(255) NOT NULL,
            dimension INTEGER NOT NULL,
            metric VARCHAR(50),
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS embedding_service.embedding_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            collection_id UUID NOT NULL,
            source_document_id UUID,
            source_chunk_count INTEGER,
            processed_chunk_count INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(32) NOT NULL,
            error_message TEXT,
            started_at TIMESTAMPTZ,
            finished_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_embedding_jobs_collection
                FOREIGN KEY (collection_id)
                REFERENCES embedding_service.embedding_collections(id)
                ON DELETE CASCADE
        )
        """
    )

    op.execute("CREATE INDEX IF NOT EXISTS idx_embedding_collections_tenant ON embedding_service.embedding_collections (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_embedding_jobs_tenant_created ON embedding_service.embedding_jobs (tenant_id, created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_embedding_jobs_collection ON embedding_service.embedding_jobs (collection_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS embedding_service.embedding_jobs")
    op.execute("DROP TABLE IF EXISTS embedding_service.embedding_collections")
    op.execute("DROP SCHEMA IF EXISTS embedding_service")
