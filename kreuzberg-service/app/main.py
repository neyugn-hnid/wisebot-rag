from fastapi import FastAPI, File, HTTPException, UploadFile
from kreuzberg import ExtractionConfig, extract_bytes
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="kreuzberg-service", version="1.0.0")

# Markdown-aware chunking: 800 chars, 120 overlap, preserve headings
EXTRACT_CONFIG = ExtractionConfig(
    use_cache=True,
)


@app.get("/health")
async def healthcheck() -> dict:
    return {"status": "ok", "service": "kreuzberg-service"}


@app.post("/parse")
async def parse(file: UploadFile = File(...)) -> dict:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        result = await extract_bytes(
            content,
            mime_type=file.content_type or "application/octet-stream",
            config=EXTRACT_CONFIG,
        )

        if not result.content:
            raise HTTPException(status_code=422, detail="No content extracted")

        # Build chunks response — handle dict/list/object chunks from Kreuzberg
        try:
            raw_chunks = result.chunks if result.chunks else []
            chunks = []
            for i, c in enumerate(raw_chunks):
                content = c.get("content") if isinstance(c, dict) else getattr(c, "content", str(c))
                chunks.append({"index": i, "content": content})
        except Exception:
            chunks = []

        if not chunks:
            chunks = [{"index": 0, "content": result.content}]

        logger.info("Parsed %s: %d chars, %d chunks, mime=%s",
                    file.filename, len(result.content), len(chunks),
                    result.metadata.get("format_type") if isinstance(result.metadata, dict) else "unknown")

        return {
            "filename": file.filename,
            "text": result.content,
            "chunks": chunks,
            "chars": len(result.content),
            "mime_type": result.metadata.get("format_type") if isinstance(result.metadata, dict) else None,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Kreuzberg parse failed for %s", file.filename)
        raise HTTPException(status_code=500, detail=f"Kreuzberg parse failed: {exc}") from exc
