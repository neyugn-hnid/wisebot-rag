import io

from docx import Document
from pypdf import PdfReader


class UnsupportedFileTypeError(ValueError):
    pass


def parse_text_from_bytes(content: bytes, filename: str, content_type: str | None = None) -> str:
    lower_name = filename.lower()
    content_type = (content_type or "").lower()

    if lower_name.endswith(".txt") or "text/plain" in content_type:
        return content.decode("utf-8", errors="ignore")

    if lower_name.endswith(".pdf") or "application/pdf" in content_type:
        reader = PdfReader(io.BytesIO(content))
        return "\n".join((page.extract_text() or "") for page in reader.pages)

    if lower_name.endswith(".docx") or "wordprocessingml.document" in content_type:
        doc = Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)

    raise UnsupportedFileTypeError("Only TXT, PDF, and DOCX are supported")
