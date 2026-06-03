from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    tenant_id: UUID
    question: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    collection_id: UUID | None = None
    knowledge_base_id: UUID | None = None
    session_id: UUID | None = None
    message_id: UUID | None = None

    # Page context: thông tin trang hiện tại (tên sản phẩm, danh mục...)
    # AI sẽ tự động nhận biết câu hỏi để trả lời phù hợp (gợi ý SP / FAQ)
    page_context: dict[str, Any] | None = None


class Citation(BaseModel):
    source_document_id: UUID
    source_chunk_id: UUID
    chunk_index: int
    score: float
    snippet: str


class AskResponse(BaseModel):
    request_id: UUID
    trace_id: str
    answer: str
    model_name: str
    citations: list[Citation]


class RagRequestDetail(BaseModel):
    id: UUID
    tenant_id: UUID
    session_id: UUID | None
    message_id: UUID | None
    trace_id: str
    status: str
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class ProviderConfigResponse(BaseModel):
    mode: str
    provider: str
    provider_name: str
    model_name: str


class ProviderModeUpdateRequest(BaseModel):
    mode: str = Field(min_length=1)
