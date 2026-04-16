def chunk_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    cleaned = " ".join(text.split())
    if not cleaned:
        return []

    if chunk_overlap >= chunk_size:
        chunk_overlap = max(0, chunk_size // 4)

    chunks: list[str] = []
    start = 0
    text_len = len(cleaned)

    while start < text_len:
        end = min(text_len, start + chunk_size)
        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= text_len:
            break

        start = max(0, end - chunk_overlap)

    return chunks
