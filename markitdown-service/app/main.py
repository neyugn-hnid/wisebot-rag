import os
import re
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from markitdown import MarkItDown


app = FastAPI(title="markitdown-service", version="1.0.0")
converter = MarkItDown()


DATA_IMAGE_PATTERN = re.compile(r"!\[[^\]]*]\(data:image/[^)]*\)", re.IGNORECASE)
EMPTY_MARKUP_LINE_PATTERN = re.compile(r"(?m)^\s*(?:[*_`#>-]\s*){3,}$")
EXCESSIVE_BLANK_LINES_PATTERN = re.compile(r"\n{3,}")


def sanitize_markdown(markdown: str) -> str:
    markdown = DATA_IMAGE_PATTERN.sub("", markdown)
    markdown = EMPTY_MARKUP_LINE_PATTERN.sub("", markdown)
    markdown = EXCESSIVE_BLANK_LINES_PATTERN.sub("\n\n", markdown)
    return markdown.strip()


@app.get("/health")
async def healthcheck() -> dict:
    return {"status": "ok", "service": "markitdown-service"}


@app.post("/parse")
async def parse(file: UploadFile = File(...)) -> dict:
    suffix = Path(file.filename or "upload").suffix
    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)

    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")

        with open(tmp_path, "wb") as tmp:
            tmp.write(content)

        result = converter.convert(tmp_path)
        markdown = sanitize_markdown(result.text_content or "")
        if not markdown:
            raise HTTPException(status_code=422, detail="No markdown extracted")

        return {
            "filename": file.filename,
            "markdown": markdown,
            "chars": len(markdown),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"MarkItDown parse failed: {exc}") from exc
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
