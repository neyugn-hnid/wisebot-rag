from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CreateCollectionRequest(BaseModel):
    tenant_id: UUID
    knowledge_base_id: UUID
    name: str = Field(min_length=1, max_length=255)
    provider: str = Field(default="ollama", min_length=1, max_length=50)
    model_name: str = Field(default="nomic-embed-text", min_length=1, max_length=120)
    dimension: int = Field(default=1536, ge=1)
    metric: str = Field(default="cosine")


class CollectionResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    knowledge_base_id: UUID
    name: str
    provider: str
    model_name: str
    dimension: int
    metric: str
    status: str
    created_at: datetime


class IndexTextRequest(BaseModel):
    tenant_id: UUID
    collection_id: UUID
    source_document_id: UUID
    text: str = Field(min_length=1)
    chunk_size: int | None = Field(default=None, ge=200)
    chunk_overlap: int | None = Field(default=None, ge=0)
    metadata: dict = Field(default_factory=dict)


class SearchRequest(BaseModel):
    tenant_id: UUID
    query: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)
    collection_id: UUID | None = None


class SearchResult(BaseModel):
    id: UUID
    source_document_id: UUID
    source_chunk_id: UUID
    chunk_index: int
    chunk_text: str
    score: float
    metadata: dict


class SearchResponse(BaseModel):
    items: list[SearchResult]


class EmbedChunkRequest(BaseModel):
    index: int = Field(ge=0)
    content: str = Field(min_length=1)


class EmbedRequest(BaseModel):
    knowledge_base_id: UUID = Field(alias="knowledgeBaseId")
    document_id: UUID = Field(alias="documentId")
    chunks: list[EmbedChunkRequest] = Field(min_length=1)


class EmbedResultResponse(BaseModel):
    index: int
    embedding_id: str = Field(alias="embeddingId")


class EmbedResponse(BaseModel):
    results: list[EmbedResultResponse]
