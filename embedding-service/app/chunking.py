import re
import math
from functools import lru_cache


SENTENCE_SPLIT_PATTERN = re.compile(r"(?<=[.!?;:])\s+|\n+")
WORD_OR_PUNCT_PATTERN = re.compile(r"[A-Za-z0-9_]+|[^\w\s]", flags=re.UNICODE)
CJK_CHAR_PATTERN = re.compile(r"[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]")


def _normalize_whitespace(text: str) -> str:
    # Keep paragraph boundaries while reducing noisy spacing.
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

    # Keep estimation conservative for subword tokenizers used by embedding models.
    rule_based = len(cjk_chars) + len(non_cjk_tokens)
    char_based = max(1, math.ceil(len(cleaned) / 4))
    return max(rule_based, char_based)


def _estimate_tokens(text: str) -> int:
    cleaned = _normalize_whitespace(text)
    return _estimate_tokens_from_normalized(cleaned)


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

        # Điều chỉnh best_end về ranh giới từ (khoảng trắng) gần nhất
        if best_end < text_len:
            # Lùi về khoảng trắng gần nhất trước best_end
            space_pos = normalized.rfind(" ", start + 1, best_end)
            if space_pos > start:
                best_end = space_pos + 1  # +1 để giữ khoảng trắng cho lần cắt sau không dính

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

    word_token_pairs = [(word, _estimate_tokens(word)) for word in words]
    for word, word_tokens in word_token_pairs:
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
            continue
        normalized_parts.extend(_split_by_token_budget(part, max_tokens))

    return normalized_parts


def _to_sentences(cleaned: str, chunk_token_size: int) -> list[str]:
    raw_sentences = [_normalize_whitespace(s) for s in SENTENCE_SPLIT_PATTERN.split(cleaned)]
    raw_sentences = [s for s in raw_sentences if s]

    sentences: list[str] = []
    for sentence in raw_sentences:
        if _estimate_tokens(sentence) <= chunk_token_size:
            sentences.append(sentence)
            continue

        sentences.extend(_split_long_sentence(sentence, chunk_token_size))

    return sentences


def _pack_sentences(
    sentences: list[str],
    sentence_tokens: list[int],
    chunk_token_size: int,
) -> tuple[list[list[str]], list[list[int]]]:
    packed_sentences: list[list[str]] = []
    packed_tokens: list[list[int]] = []
    current_sentences: list[str] = []
    current_token_values: list[int] = []
    current_tokens = 0

    for sentence, token_count in zip(sentences, sentence_tokens):
        candidate_tokens = current_tokens + token_count

        if current_sentences and candidate_tokens > chunk_token_size:
            packed_sentences.append(current_sentences)
            packed_tokens.append(current_token_values)
            current_sentences = [sentence]
            current_token_values = [token_count]
            current_tokens = token_count
        else:
            current_sentences.append(sentence)
            current_token_values.append(token_count)
            current_tokens = candidate_tokens

    if current_sentences:
        packed_sentences.append(current_sentences)
        packed_tokens.append(current_token_values)

    return packed_sentences, packed_tokens


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


def chunk_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    cleaned = _normalize_whitespace(text)
    if not cleaned:
        return []

    if chunk_size <= 0:
        return []

    if chunk_overlap >= chunk_size:
        chunk_overlap = max(0, chunk_size // 4)

    sentences = _to_sentences(cleaned, chunk_size)
    if not sentences:
        return []

    sentence_tokens = [_estimate_tokens(sentence) for sentence in sentences]
    packed_chunks, packed_chunk_tokens = _pack_sentences(sentences, sentence_tokens, chunk_size)

    chunks: list[str] = []
    for idx, sentence_group in enumerate(packed_chunks):
        if idx == 0:
            chunk_text_value = " ".join(sentence_group).strip()
            if chunk_text_value:
                chunks.append(chunk_text_value)
            continue

        overlap_prefix, overlap_token_values = _tail_overlap(
            packed_chunks[idx - 1],
            packed_chunk_tokens[idx - 1],
            chunk_overlap,
        )
        merged = overlap_prefix + sentence_group
        merged_token_values = overlap_token_values + packed_chunk_tokens[idx]
        chunk_text_value = " ".join(merged).strip()

        max_with_overlap_tokens = chunk_size + chunk_overlap
        merged_tokens_total = sum(merged_token_values)
        while merged_tokens_total > max_with_overlap_tokens and len(merged) > 1:
            merged_tokens_total -= merged_token_values[0]
            merged.pop(0)
            merged_token_values.pop(0)
            chunk_text_value = " ".join(merged).strip()

        if chunk_text_value:
            chunks.append(chunk_text_value)

    return chunks
