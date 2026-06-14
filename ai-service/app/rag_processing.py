"""
RAG Processing utilities cho ai-service.
Chi giu: normalization, ranking, product recommend (JSON).
Da bo: FAQ extraction, section extraction, plain_text answer extraction.
"""

import json
import re
import unicodedata
from typing import Any

from app.stopwords import GREETINGS, QA_MARKERS, RANK_STOPWORDS

KB_NOT_FOUND_ANSWER = "Tôi là Trợ lý AI, tôi có thể giúp gì cho bạn không?"
KB_NOT_FOUND_MARKER = "__WISEBOT_KB_NOT_FOUND__"


# ═══════════════════════════════════════════════════════════════════════
# Text normalization
# ═══════════════════════════════════════════════════════════════════════

def _sanitize_context_text(text: str) -> str:
    return (text or "").strip()


def _normalize_for_compare(value: str) -> str:
    return re.sub(r"[\W_]+", "", value or "", flags=re.UNICODE).lower()


def _fold_for_match(value: str) -> str:
    text = (value or "").lower().replace("đ", "d").replace("Đ", "d")
    decomposed = unicodedata.normalize("NFD", text)
    no_marks = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return re.sub(r"[\W_]+", "", no_marks, flags=re.UNICODE)


def _tokenize_for_rank(value: str) -> set[str]:
    folded = unicodedata.normalize(
        "NFD",
        (value or "").lower().replace("đ", "d").replace("Đ", "d"),
    )
    folded = "".join(ch for ch in folded if unicodedata.category(ch) != "Mn")
    words = re.findall(r"[a-z0-9]+", folded, flags=re.UNICODE)
    return {word for word in words if len(word) > 1 and word not in RANK_STOPWORDS}


# ═══════════════════════════════════════════════════════════════════════
# Chunk ranking
# ═══════════════════════════════════════════════════════════════════════

def _rank_context_chunks(question: str, chunks: list[dict]) -> list[dict]:
    question_norm = _normalize_for_compare(question)
    question_terms = _tokenize_for_rank(question)

    def score_chunk(chunk: dict) -> tuple[int, float]:
        text = _sanitize_context_text(str(chunk.get("chunk_text") or ""))
        text_norm = _normalize_for_compare(text)
        text_terms = _tokenize_for_rank(text)
        score = 0
        if question_norm and question_norm in text_norm:
            score += 1000
            if any(marker in text_norm for marker in QA_MARKERS):
                score += 250
        if text_norm.startswith(("hoi", "cauhoi", "q")) and question_norm and question_norm in text_norm:
            score += 150
        score += len(question_terms & text_terms) * 10
        return score, float(chunk.get("score", 0.0))

    return sorted(chunks, key=score_chunk, reverse=True)


# ═══════════════════════════════════════════════════════════════════════
# Question analysis
# ═══════════════════════════════════════════════════════════════════════

def _generic_attribute_terms() -> set[str]:
    return {
        "a", "an", "the", "là", "la", "có", "co", "không", "khong", "cho", "và", "va",
        "bao", "nhiêu", "nhieu", "bao nhiêu", "bao nhieu", "gì", "gi", "nào", "nao",
        "thế", "the", "nào", "với", "voi", "của", "cua", "tôi", "toi", "bạn", "ban",
        "xin", "hãy", "hay", "giúp", "giup", "cho biết", "cho biet", "thông", "tin",
        "nhi", "th", "ng", "kh", "tr", "li",
    }


def _question_lookup_terms(question: str) -> set[str]:
    attribute_terms = _generic_attribute_terms()
    terms = {
        term
        for term in _tokenize_for_rank(question)
        if term not in attribute_terms and not term.isdigit()
    }
    terms.update(term.strip() for term in re.findall(r"\d+\s*(?:mah|gb|mp|inch)?", question.lower()))
    return {term for term in terms if term}


def _is_obvious_out_of_scope(question: str) -> bool:
    return False


def _is_plain_greeting(question: str) -> bool:
    normalized = _normalize_for_compare(question)
    return normalized in GREETINGS


def _context_contains_question_terms(question: str, chunks: list[dict]) -> bool:
    question_terms = _tokenize_for_rank(question)
    if not question_terms:
        return False
    for chunk in chunks[:5]:
        text_terms = _tokenize_for_rank(str(chunk.get("chunk_text") or ""))
        if question_terms & text_terms:
            return True
    return False


def _is_safe_query_variant(original: str, variant: str) -> bool:
    original_terms = _tokenize_for_rank(original)
    if not original_terms:
        return True
    variant_terms = _tokenize_for_rank(variant)
    if not variant_terms:
        return False
    overlap = len(original_terms & variant_terms)
    return overlap >= max(1, min(3, len(original_terms)))


# ═══════════════════════════════════════════════════════════════════════
# Answer processing
# ═══════════════════════════════════════════════════════════════════════

def _strip_json_products_block(answer: str) -> str:
    start_marker = "__JSON_PRODUCTS__"
    end_marker = "__END_JSON__"
    cleaned = answer
    while start_marker in cleaned and end_marker in cleaned:
        start = cleaned.find(start_marker)
        end = cleaned.find(end_marker, start)
        if end < 0:
            break
        cleaned = cleaned[:start] + cleaned[end + len(end_marker):]
    return cleaned.strip()


def _normalize_answer_text(answer: str, question: str) -> str:
    """Clean common LLM artifacts from the answer."""
    answer = answer.strip()
    question_key = _normalize_for_compare(question)
    if question_key:
        lines = answer.splitlines()
        while lines and not lines[0].strip():
            lines.pop(0)
        if lines:
            first = re.sub(r"^\s*[-*]\s*", "", lines[0]).strip()
            first = re.sub(
                r"^\s*(?:câu hỏi|cau hoi|question)\s*[:：-]\s*",
                "", first, flags=re.IGNORECASE,
            ).strip()
            first = first.rstrip(":：")
            first_norm = _normalize_for_compare(first)
            if first_norm and (first_norm == question_key or question_key in first_norm):
                answer = "\n".join(lines[1:]).strip()

    for prefix in ("Trả lời:", "Tra loi:", "Answer:", "- ",):
        if answer.lower().startswith(prefix.lower()):
            answer = answer[len(prefix):].strip()

    return answer.strip()


# ═══════════════════════════════════════════════════════════════════════
# Markdown table parsing (for product Recommend mode)
# ═══════════════════════════════════════════════════════════════════════

def _clean_table_cell(value: str) -> str:
    return (value or "").replace("\\_", "_").strip()


def _format_vnd(value: str) -> str:
    digits = re.sub(r"\D+", "", value or "")
    if not digits:
        return value.strip()
    return f"{int(digits):,}".replace(",", ".") + " VND"


def _looks_like_money_column(header: str) -> bool:
    normalized = _normalize_for_compare(header)
    return any(term in normalized for term in ("gia", "price", "cost", "fee", "phi", "hocphi", "luong"))


def _looks_like_name_column(header: str) -> bool:
    normalized = _normalize_for_compare(header)
    return any(term in normalized for term in ("ten", "name", "title", "subject", "item"))


def _format_table_value(header: str, value: str) -> str:
    if _looks_like_money_column(header):
        return _format_vnd(value)
    return value.strip()


def _parse_markdown_table_rows(chunks: list[dict]) -> list[dict]:
    rows: list[dict] = []
    headers: list[str] = []

    table_lines: list[tuple[list[str], dict]] = []
    for chunk in chunks:
        text = _sanitize_context_text(str(chunk.get("chunk_text") or ""))
        for line in text.splitlines():
            stripped = line.strip()
            if not stripped.startswith("|") or not stripped.endswith("|"):
                continue
            cells = [_clean_table_cell(cell) for cell in stripped.strip("|").split("|")]
            if not cells:
                continue
            if all(re.fullmatch(r"[-:\s]+", cell or "") for cell in cells):
                continue
            table_lines.append((cells, chunk))
            has_text = sum(1 for cell in cells if re.search(r"[A-Za-zÀ-ỹ]", cell))
            has_numeric = sum(1 for cell in cells if re.search(r"\d", cell))
            if not headers and has_text >= max(2, len(cells) // 2) and has_numeric == 0:
                headers = cells

    if not headers:
        return rows

    for cells, chunk in table_lines:
        if cells == headers or len(cells) != len(headers):
            continue
        if not any(cell.strip() for cell in cells):
            continue
        row = {headers[index]: cells[index] for index in range(len(headers))}
        rows.append({"headers": headers, "row": row, "text": " ".join(cells), "chunk": chunk})

    return rows


def _has_non_table_context(chunks: list[dict]) -> bool:
    for chunk in chunks:
        text = _sanitize_context_text(str(chunk.get("chunk_text") or ""))
        plain_lines = []
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith("|") and line.endswith("|"):
                continue
            if re.fullmatch(r"[-:\s|]+", line):
                continue
            if line.startswith("##") and len(line) < 80:
                continue
            plain_lines.append(line)
        if len(" ".join(plain_lines).strip()) >= 80:
            return True
    return False


def _row_display_name(row: dict) -> str:
    for header, value in row.items():
        if _looks_like_name_column(header) and value:
            return value
    for header, value in row.items():
        if _normalize_for_compare(header) == "id":
            continue
        if value and re.search(r"[A-Za-zÀ-ỹ]", value):
            return value
    return next((value for value in row.values() if value), "")


def _find_table_column(headers: list[str], *needles: str) -> str | None:
    for header in headers:
        normalized = _normalize_for_compare(header)
        if any(needle in normalized for needle in needles):
            return header
    return None


def _find_exact_table_column(headers: list[str], *names: str) -> str | None:
    normalized_names = {_normalize_for_compare(name) for name in names}
    for header in headers:
        if _normalize_for_compare(header) in normalized_names:
            return header
    return None


def _parse_number(value: str) -> int | None:
    digits = re.sub(r"\D+", "", value or "")
    if not digits:
        return None
    try:
        return int(digits)
    except ValueError:
        return None


def _extract_budget(question: str) -> int | None:
    numbers = [_parse_number(match.group(0)) for match in re.finditer(r"\d[\d.,\s]{4,}", question or "")]
    values = [number for number in numbers if number and number >= 10000]
    return max(values) if values else None


def _question_requested_columns(question: str, headers: list[str]) -> list[str]:
    q_norm = _normalize_for_compare(question)
    requested: list[str] = []
    for header in headers:
        header_norm = _normalize_for_compare(header)
        if header_norm and header_norm in q_norm:
            requested.append(header)
    if requested:
        return requested
    money_triggers = ("gia", "gi", "price", "cost", "fee", "phi", "hocphi", "luong")
    if any(trigger in q_norm for trigger in money_triggers):
        requested = [header for header in headers if _looks_like_money_column(header)]
    return requested


def _try_answer_from_markdown_table(question: str, chunks: list[dict]) -> str | None:
    """Tra loi tu bang markdown (pipe table) - dung cho cau hoi cu the ve cot."""
    rows = _parse_markdown_table_rows(_rank_context_chunks(question, chunks))
    if not rows:
        return None

    q_terms = _question_lookup_terms(question)

    def row_score(item: dict) -> int:
        row_text_norm = _normalize_for_compare(item["text"])
        score = 0
        for term in q_terms:
            term_norm = _normalize_for_compare(term)
            if term_norm and term_norm in row_text_norm:
                score += 2
        display_name_norm = _normalize_for_compare(_row_display_name(item["row"]))
        if display_name_norm and display_name_norm in q_terms:
            score += 8
        return score

    scored = [(row_score(item), item) for item in rows]
    strict_matched = []
    if len(q_terms) >= 2:
        strict_matched = [
            item for _, item in scored
            if all(_normalize_for_compare(term) in _normalize_for_compare(item["text"]) for term in q_terms)
        ]
    if any(re.search(r"\d", term) for term in q_terms) and len(q_terms) >= 2 and not strict_matched:
        return None
    matched = strict_matched or [
        item for score, item in sorted(scored, key=lambda pair: pair[0], reverse=True) if score > 0
    ]
    if not matched:
        return None

    headers = matched[0].get("headers") or list(matched[0]["row"].keys())
    requested_columns = _question_requested_columns(question, headers)
    if not requested_columns:
        return None

    lines = []
    for item in matched[:6]:
        row = item["row"]
        display_name = _row_display_name(row)
        values = []
        for header in requested_columns:
            value = row.get(header, "")
            if value:
                formatted_value = _format_table_value(header, value)
                if len(requested_columns) == 1 and _looks_like_money_column(header):
                    values.append(formatted_value)
                else:
                    values.append(f"{header}: {formatted_value}")
        if values:
            prefix = f"{display_name}: " if display_name else ""
            lines.append(f"- {prefix}{', '.join(values)}")

    if len(lines) == 1:
        return lines[0].removeprefix("- ")
    if lines:
        return "\n".join(lines)
    return None


def _try_product_recommend_from_markdown_table(question: str, chunks: list[dict]) -> str | None:
    """Goi y san pham tu bang markdown - dung cho Recommend mode."""
    rows = _parse_markdown_table_rows(_rank_context_chunks(question, chunks))
    if not rows:
        return None

    headers = rows[0].get("headers") or list(rows[0]["row"].keys())
    id_col = _find_table_column(headers, "id", "ma")
    name_col = _find_table_column(headers, "tensanpham", "sanpham", "name", "title", "ten")
    price_col = next((header for header in headers if _looks_like_money_column(header)), None)
    image_col = _find_exact_table_column(
        headers, "imageUrl", "image_url", "image", "img", "anh", "hinh_anh",
        "thumbnail", "thumbnail_url", "url_anh", "link_anh",
    )
    detail_col = _find_exact_table_column(
        headers, "detailUrl", "detail_url", "detail", "url", "link",
        "product_url", "duong_dan", "lien_ket",
    )
    if not id_col or not name_col or not price_col:
        return None

    budget = _extract_budget(question)
    query_terms = _question_lookup_terms(question) - {
        "mua", "muon", "cần", "can", "tư", "tu", "vấn", "van", "gợi", "goi",
        "ý", "de", "xuat", "chon", "chọn", "phu", "hop", "ngan", "sach", "tam",
        "gia", "gi",
    }

    candidates = []
    for item in rows:
        row = item["row"]
        price = _parse_number(row.get(price_col, ""))
        product_id = _parse_number(row.get(id_col, ""))
        name = row.get(name_col, "").strip()
        if not product_id or not name or price is None:
            continue
        if budget is not None and price > budget:
            continue
        row_norm = _normalize_for_compare(item["text"])
        score = sum(2 for term in query_terms if _normalize_for_compare(term) in row_norm)
        if budget is not None:
            score += max(0, 100000000 - abs(budget - price)) / 100000000
        candidates.append((score, price, row, product_id, name))

    if not candidates:
        return None

    candidates.sort(key=lambda item: (item[0], item[1]), reverse=True)
    products = []
    for _, _, row, product_id, name in candidates[:3]:
        price = _parse_number(row.get(price_col, "")) or 0
        reason_col = _find_table_column(headers, "mota", "description", "phuhop", "reason")
        products.append({
            "id": product_id,
            "name": name,
            "price": price,
            "imageUrl": row.get(image_col, "") if image_col else "",
            "detailUrl": row.get(detail_col, "") if detail_col else "",
            "reason": row.get(reason_col or "", "").strip() or "Sản phẩm này phù hợp với thông tin bạn yêu cầu.",
        })

    intro = "Mình gợi ý một số sản phẩm phù hợp với nhu cầu của bạn:"
    return (
        intro
        + "\n__JSON_PRODUCTS__\n"
        + json.dumps(products, ensure_ascii=False, indent=2)
        + "\n__END_JSON__"
    )
