"""enhance ai_service schema

Revision ID: 20260427_0002
Revises: 20260413_0001
Create Date: 2026-04-27
"""

from alembic import op


revision = "20260427_0002"
down_revision = "20260413_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create ai_models table
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_service.ai_models (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider VARCHAR(50) NOT NULL,
            model_name VARCHAR(120) NOT NULL,
            modality VARCHAR(20) NOT NULL DEFAULT 'TEXT',
            max_context_tokens INT,
            max_output_tokens INT,
            active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT chk_ai_models_modality CHECK (modality IN ('TEXT', 'MULTIMODAL')),
            CONSTRAINT uq_ai_models_provider_name UNIQUE (provider, model_name)
        )
        """
    )

    # 2. Create ai_prompt_templates table
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_service.ai_prompt_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID, -- NULL means global template
            template_code VARCHAR(120) NOT NULL,
            version INT NOT NULL DEFAULT 1,
            system_prompt TEXT NOT NULL,
            user_prompt_template TEXT NOT NULL,
            variables_schema JSONB,
            active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_ai_prompt_tenant_code_version UNIQUE (tenant_id, template_code, version)
        )
        """
    )

    # 3. Create ai_response_cache table
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_service.ai_response_cache (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            cache_key VARCHAR(128) NOT NULL UNIQUE,
            tenant_id UUID,
            model_name VARCHAR(120) NOT NULL,
            response_json JSONB NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_service.ai_response_cache (expires_at)")

    # 4. Enhance ai_rag_requests table
    op.execute("ALTER TABLE ai_service.ai_rag_requests ADD COLUMN IF NOT EXISTS model_id UUID")
    op.execute(
        """
        ALTER TABLE ai_service.ai_rag_requests 
        ADD CONSTRAINT fk_ai_rag_request_model 
        FOREIGN KEY (model_id) REFERENCES ai_service.ai_models(id) 
        ON DELETE SET NULL
        """
    )
    
    # Update status check if needed (Postgres doesn't allow easy ALTER CONSTRAINT, usually drop and recreate)
    op.execute("ALTER TABLE ai_service.ai_rag_requests DROP CONSTRAINT IF EXISTS chk_ai_rag_status")
    op.execute(
        """
        ALTER TABLE ai_service.ai_rag_requests 
        ADD CONSTRAINT chk_ai_rag_status 
        CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'TIMEOUT'))
        """
    )

    # 5. Seed default data
    op.execute(
        """
        INSERT INTO ai_service.ai_models (provider, model_name, modality, max_context_tokens, max_output_tokens)
        VALUES ('ollama', 'llama3:latest', 'TEXT', 8192, 2048)
        ON CONFLICT DO NOTHING
        """
    )

    op.execute(
        """
        INSERT INTO ai_service.ai_prompt_templates (template_code, version, system_prompt, user_prompt_template)
        VALUES (
            'default_rag', 
            1, 
            'You are WISEBOT AI assistant. STRICT RULES: - ONLY answer using the provided CONTEXT. - DO NOT use outside knowledge. - If the answer is not in the context, say: "Không tìm thấy thông tin trong tài liệu." - DO NOT hallucinate. Answer in Vietnamese. Always cite sources like [1], [2].',
            'Question:\n{question}\n\nContext:\n{context_text}\n\nAnswer in Vietnamese with citations.'
        )
        ON CONFLICT DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE ai_service.ai_rag_requests DROP CONSTRAINT IF EXISTS fk_ai_rag_request_model")
    op.execute("ALTER TABLE ai_service.ai_rag_requests DROP COLUMN IF EXISTS model_id")
    op.execute("DROP TABLE IF EXISTS ai_service.ai_response_cache")
    op.execute("DROP TABLE IF EXISTS ai_service.ai_prompt_templates")
    op.execute("DROP TABLE IF EXISTS ai_service.ai_models")
