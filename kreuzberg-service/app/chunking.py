import math
import re
from functools import lru_cache


SENTENCE_SPLIT_PATTERN = re.compile(r"(?<=[.!?;:])\s+|\n+")
WORD_OR_PUNCT_PATTERN = re.compile(r"[A-Za-z0-9_]+|[^\w\s]", flags=re.UNICODE)
CJK_CHAR_PATTERN = re.compile(r"[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]")
NUMBERED_HEADING_PATTERN = re.compile(r"^\s*\d{1,3}[.)]\s+\S")
QA_PAIR_PATTERN = re.compile(
    r"(?:^|\s)(Hỏi|Câu hỏi|Q)\s*:\s*(.+?)\s+(Trả lời|Đáp|A)\s*:\s*(.+?)(?=(?:\s+(?:Hỏi|Câu hỏi|Q)\s*:)|\Z)",
    flags=re.IGNORECASE | re.DOTALL,
)


def _normalize_whitespace(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


@lru_cache(maxsize=16384)
def _estimate_tokens_from_normalized(cleaned: str) -> int:
    if not cleaned:
        return 0

    cjk_chars = CJK_CHAR_PATTERN.findall(cleaned)
    non_cjk_text = CJK_CHAR_PATTERN.sub(" ", cleaned)
    non_cjk_tokens = WORD_OR_PUNCT_PATTERN.findall(non_cjk_text)

    rule_based = len(cjk_chars) + len(non_cjk_tokens)
    char_based = max(1, math.ceil(len(cleaned) / 4))
    return max(rule_based, char_based)


def _estimate_tokens(text: str) -> int:
    return _estimate_tokens_from_normalized(_normalize_whitespace(text))


def _split_by_token_budget(text: str, max_tokens: int) -> list[str]:
    if max_tokens <= 0:
        return []

    normalized = _normalize_whitespace(text)
    if not normalized:
        return []

    parts: list[str] = []
    start = 0
    text_len = len(normalized)

    while start < text_len:
        low = start + 1
        high = text_len
        best_end = low

        while low <= high:
            mid = (low + high) // 2
            candidate = normalized[start:mid].strip()
            if candidate and _estimate_tokens(candidate) <= max_tokens:
                best_end = mid
                low = mid + 1
            else:
                high = mid - 1

        if best_end < text_len:
            space_pos = normalized.rfind(" ", start + 1, best_end)
            if space_pos > start:
                best_end = space_pos + 1

        chunk = normalized[start:best_end].strip()
        if not chunk:
            best_end = min(text_len, start + 1)
            chunk = normalized[start:best_end].strip()

        if chunk:
            parts.append(chunk)

        start = best_end

    return parts


def _split_long_sentence(sentence: str, max_tokens: int) -> list[str]:
    words = sentence.split()
    if not words:
        return []

    parts: list[str] = []
    current_words: list[str] = []
    current_tokens = 0

    for word in words:
        word_tokens = _estimate_tokens(word)
        candidate_tokens = current_tokens + word_tokens
        if current_words and candidate_tokens > max_tokens:
            parts.append(" ".join(current_words))
            current_words = [word]
            current_tokens = word_tokens
        else:
            current_words.append(word)
            current_tokens = candidate_tokens

    if current_words:
        parts.append(" ".join(current_words))

    normalized_parts: list[str] = []
    for part in parts:
        if _estimate_tokens(part) <= max_tokens:
            normalized_parts.append(part)
        else:
            normalized_parts.extend(_split_by_token_budget(part, max_tokens))

    return normalized_parts


def _to_sentences(cleaned: str, chunk_token_size: int) -> list[str]:
    raw_sentences = [_normalize_whitespace(s) for s in SENTENCE_SPLIT_PATTERN.split(cleaned)]
    raw_sentences = [s for s in raw_sentences if s]

    sentences: list[str] = []
    for sentence in raw_sentences:
        if _estimate_tokens(sentence) <= chunk_token_size:
            sentences.append(sentence)
        else:
            sentences.extend(_split_long_sentence(sentence, chunk_token_size))

    return sentences


def _split_numbered_sections(cleaned: str) -> list[str]:
    lines = cleaned.splitlines()
    if len(lines) <= 1:
        return [cleaned]

    sections: list[str] = []
    current: list[str] = []

    for line in lines:
        stripped = line.strip()
        if NUMBERED_HEADING_PATTERN.match(stripped) and current:
            sections.append("\n".join(current).strip())
            current = [line]
        else:
            current.append(line)

    if current:
        sections.append("\n".join(current).strip())

    return [section for section in sections if section]


def _extract_qa_blocks(text: str) -> list[str]:
    blocks: list[str] = []
    for match in QA_PAIR_PATTERN.finditer(text):
        question = _normalize_whitespace(match.group(2))
        answer = _normalize_whitespace(match.group(4))
        if question and answer:
            blocks.append(f"Hỏi: {question}\nTrả lời: {answer}")
    return blocks


def _structured_blocks(cleaned: str) -> list[str]:
    sections = _split_numbered_sections(cleaned)
    blocks: list[str] = []
    seen: set[str] = set()

    for section in sections:
        candidates = _extract_qa_blocks(section) or [section]
        for candidate in candidates:
            normalized = _normalize_whitespace(candidate)
            if normalized and normalized not in seen:
                blocks.append(normalized)
                seen.add(normalized)

    return blocks or [cleaned]


def _tail_overlap(
    sentences: list[str],
    sentence_tokens: list[int],
    overlap_token_limit: int,
) -> tuple[list[str], list[int]]:
    if overlap_token_limit <= 0 or not sentences:
        return [], []

    overlap: list[str] = []
    overlap_token_values: list[int] = []
    overlap_tokens = 0

    for sentence, token_count in zip(reversed(sentences), reversed(sentence_tokens)):
        candidate_tokens = overlap_tokens + token_count
        if overlap and candidate_tokens > overlap_token_limit:
            break
        overlap.insert(0, sentence)
        overlap_token_values.insert(0, token_count)
        overlap_tokens = candidate_tokens

    return overlap, overlap_token_values


def _chunk_by_sentences(cleaned: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    sentences = _to_sentences(cleaned, chunk_size)
    if not sentences:
        return []

    chunks: list[str] = []
    current_sentences: list[str] = []
    current_tokens: list[int] = []
    current_total = 0

    def flush_current() -> tuple[list[str], list[int]]:
        nonlocal current_sentences, current_tokens, current_total
        previous_sentences = current_sentences
        previous_tokens = current_tokens
        chunk = " ".join(previous_sentences).strip()
        if chunk:
            chunks.append(chunk)

        current_sentences, current_tokens = _tail_overlap(
            previous_sentences,
            previous_tokens,
            chunk_overlap,
        )
        current_total = sum(current_tokens)
        return previous_sentences, previous_tokens

    for sentence in sentences:
        token_count = _estimate_tokens(sentence)
        if current_sentences and current_total + token_count > chunk_size:
            flush_current()

        if current_sentences and current_total + token_count > chunk_size + chunk_overlap:
            current_sentences = []
            current_tokens = []
            current_total = 0

        current_sentences.append(sentence)
        current_tokens.append(token_count)
        current_total += token_count

    if current_sentences:
        chunk = " ".join(current_sentences).strip()
        if chunk:
            chunks.append(chunk)

    return chunks


def chunk_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    cleaned = _normalize_whitespace(text)
    if not cleaned or chunk_size <= 0:
        return []

    if chunk_overlap >= chunk_size:
        chunk_overlap = max(0, chunk_size // 4)

    if cleaned.count("\n") >= 2:
        chunks: list[str] = []
        for block in _structured_blocks(cleaned):
            if _estimate_tokens(block) <= chunk_size:
                chunks.append(block)
            else:
                chunks.extend(_chunk_by_sentences(block, chunk_size, chunk_overlap))
        return chunks

    return _chunk_by_sentences(cleaned, chunk_size, chunk_overlap)
