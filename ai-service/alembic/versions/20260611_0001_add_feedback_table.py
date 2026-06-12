"""add ai_service.ai_rag_feedback table

Revision ID: 20260611_0001
Revises: 20260413_0001
Create Date: 2026-06-11
"""

from alembic import op


revision = "20260611_0001"
down_revision = "20260413_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_service.ai_rag_feedback (
            id BIGSERIAL PRIMARY KEY,
            request_id UUID NOT NULL,
            tenant_id UUID NOT NULL,
            session_id UUID,
            rating BOOLEAN NOT NULL,
            comment TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_ai_feedback_request
                FOREIGN KEY (request_id)
                REFERENCES ai_service.ai_rag_requests(id)
                ON DELETE CASCADE
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_ai_feedback_request ON ai_service.ai_rag_feedback (request_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_ai_feedback_tenant_created ON ai_service.ai_rag_feedback (tenant_id, created_at DESC)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS ai_service.ai_rag_feedback")
