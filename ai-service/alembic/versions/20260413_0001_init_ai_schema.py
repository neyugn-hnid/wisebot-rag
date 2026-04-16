"""init ai_service schema

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
    op.execute("CREATE SCHEMA IF NOT EXISTS ai_service")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_service.ai_rag_requests (
            id UUID PRIMARY KEY,
            tenant_id UUID NOT NULL,
            session_id UUID,
            message_id UUID,
            trace_id TEXT NOT NULL,
            temperature DOUBLE PRECISION,
            top_k INTEGER,
            max_tokens INTEGER,
            status VARCHAR(32) NOT NULL,
            error_message TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMPTZ,
            finished_at TIMESTAMPTZ
        )
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_service.ai_rag_retrieval_results (
            id BIGSERIAL PRIMARY KEY,
            request_id UUID NOT NULL,
            source_document_id UUID,
            source_chunk_id UUID,
            score DOUBLE PRECISION,
            rank_no INTEGER,
            snippet TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_ai_retrieval_request
                FOREIGN KEY (request_id)
                REFERENCES ai_service.ai_rag_requests(id)
                ON DELETE CASCADE
        )
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_service.ai_llm_calls (
            id BIGSERIAL PRIMARY KEY,
            request_id UUID NOT NULL,
            provider VARCHAR(64),
            model_name VARCHAR(128),
            prompt_tokens INTEGER,
            completion_tokens INTEGER,
            total_tokens INTEGER,
            latency_ms INTEGER,
            finish_reason VARCHAR(64),
            request_payload JSONB,
            response_payload JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_ai_llm_request
                FOREIGN KEY (request_id)
                REFERENCES ai_service.ai_rag_requests(id)
                ON DELETE CASCADE
        )
        """
    )

    op.execute("CREATE INDEX IF NOT EXISTS idx_ai_rag_requests_tenant_created ON ai_service.ai_rag_requests (tenant_id, created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_ai_rag_requests_status ON ai_service.ai_rag_requests (status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_ai_rag_requests_trace_id ON ai_service.ai_rag_requests (trace_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_ai_retrieval_request_rank ON ai_service.ai_rag_retrieval_results (request_id, rank_no)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_ai_llm_calls_request ON ai_service.ai_llm_calls (request_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS ai_service.ai_llm_calls")
    op.execute("DROP TABLE IF EXISTS ai_service.ai_rag_retrieval_results")
    op.execute("DROP TABLE IF EXISTS ai_service.ai_rag_requests")
    op.execute("DROP SCHEMA IF EXISTS ai_service")
