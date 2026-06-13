import tempfile
from pathlib import Path

from kreuzberg import ExtractionConfig, extract_bytes


class UnsupportedFileTypeError(ValueError):
    pass


async def parse_text_from_bytes(content: bytes, filename: str, content_type: str | None = None) -> str:
    """Extract text from any supported file format using Kreuzberg."""
    lower_name = filename.lower()

    # Plain text — no need for Kreuzberg
    if lower_name.endswith(".txt") or (content_type and "text/plain" in content_type.lower()):
        return content.decode("utf-8", errors="ignore")

    if not content:
        raise UnsupportedFileTypeError("Empty file content")

    try:
        mime_type = content_type or _infer_mime_type(lower_name)
        config = ExtractionConfig(use_cache=True)
        result = await extract_bytes(content, mime_type=mime_type, config=config)
        return result.content or ""
    except Exception as exc:
        raise UnsupportedFileTypeError(
            f"Kreuzberg could not parse '{filename}': {exc}"
        ) from exc


def _infer_mime_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    mime_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".docm": "application/vnd.ms-word.document.macroenabled.12",
        ".dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
        ".dot": "application/msword",
        ".doc": "application/msword",
        ".odt": "application/vnd.oasis.opendocument.text",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xls": "application/vnd.ms-excel",
        ".xlsm": "application/vnd.ms-excel.sheet.macroenabled.12",
        ".ods": "application/vnd.oasis.opendocument.spreadsheet",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".ppt": "application/vnd.ms-powerpoint",
        ".pptm": "application/vnd.ms-powerpoint.presentation.macroenabled.12",
        ".html": "text/html",
        ".htm": "text/html",
        ".xml": "application/xml",
        ".csv": "text/csv",
        ".json": "application/json",
        ".yaml": "application/x-yaml",
        ".yml": "application/x-yaml",
        ".md": "text/markdown",
        ".markdown": "text/markdown",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
        ".tiff": "image/tiff",
        ".tif": "image/tiff",
        ".svg": "image/svg+xml",
        ".eml": "message/rfc822",
        ".msg": "application/vnd.ms-outlook",
        ".epub": "application/epub+zip",
        ".rtf": "application/rtf",
        ".zip": "application/zip",
        ".tar": "application/x-tar",
        ".gz": "application/gzip",
        ".7z": "application/x-7z-compressed",
    }
    return mime_map.get(ext, "application/octet-stream")
