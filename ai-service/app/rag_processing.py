import json
import re
import unicodedata
from typing import Any


KB_NOT_FOUND_ANSWER = "Tôi là Trợ lý AI, tôi có thể giúp gì cho bạn không?"
KB_NOT_FOUND_MARKER = "__WISEBOT_KB_NOT_FOUND__"


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
    stopwords = {
        "a", "an", "the", "is", "are", "to", "of", "for", "and", "or",
        "la", "co", "cua", "cho", "va", "voi", "toi", "ban", "bao", "nhieu",
        "the", "nao", "gi", "khong", "hay", "duoc", "mua",
    }
    return {word for word in words if len(word) > 1 and word not in stopwords}


def _rank_context_chunks(question: str, chunks: list[dict]) -> list[dict]:
    question_norm = _normalize_for_compare(question)
    question_terms = _tokenize_for_rank(question)

    def score_chunk(chunk: dict) -> tuple[int, float]:
        text = _sanitize_context_text(str(chunk.get("chunk_text") or ""))
        text_norm = _normalize_for_compare(text)
        text_terms = _tokenize_for_rank(text)
        score = 0
        if question_norm and question_norm in text_norm:
            score += 100
        score += len(question_terms & text_terms) * 10
        return score, float(chunk.get("score", 0.0))

    return sorted(chunks, key=score_chunk, reverse=True)


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
        has_data = any(cell.strip() for cell in cells)
        if not has_data:
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

        plain_text = " ".join(plain_lines).strip()
        if len(plain_text) >= 80:
            return True

    return False


def _plain_text_lines(text: str) -> list[str]:
    lines = []
    for raw_line in _sanitize_context_text(text).splitlines():
        line = raw_line.strip()
        if not line:
            continue
        line_lower = line.lower()
        if any(marker.lower() in line_lower for marker in ("Câu hỏi demo gợi ý", "Cau hoi demo goi y")):
            break
        if line.startswith("##") and len(line) < 80:
            continue
        if line.startswith("|") and line.endswith("|"):
            continue
        if re.fullmatch(r"[-:\s|]+", line):
            continue
        lines.append(line)
    return lines


def _strip_qa_prefix(line: str) -> tuple[str, bool]:
    normalized = re.sub(r"^\d+\.\s*", "", line or "").strip()
    normalized = re.sub(r"^[-*]\s*", "", normalized).strip()
    key = _normalize_for_compare(normalized)
    if key.startswith(("hoi", "hỏi")):
        question_text = re.sub(r"^\s*(?:hỏi|hoi|question)\s*[:：-]?\s*", "", normalized, flags=re.IGNORECASE).strip()
        return question_text, True
    for prefix in ("traloi", "trảlời", "answer"):
        if key.startswith(prefix):
            return re.sub(r"^\s*(?:trả\s*lời|tra\s*loi|answer)\s*[:：-]?\s*", "", normalized, flags=re.IGNORECASE).strip(), False
    return normalized, False


def _is_repeated_question_line(line: str, question: str | None) -> bool:
    if not question:
        return False

    line_key = _normalize_for_compare(line.rstrip(":："))
    question_key = _normalize_for_compare(question)
    if not line_key or not question_key:
        return False
    if line_key == question_key:
        return True

    line_terms = _tokenize_for_rank(line)
    question_terms = _tokenize_for_rank(question)
    if not line_terms or not question_terms:
        return False

    overlap = len(line_terms & question_terms)
    if line_key in question_key and overlap >= max(1, min(3, len(line_terms))):
        return True
    if question_key in line_key and overlap >= max(2, min(4, len(question_terms))):
        return True
    return False


def _format_plain_answer_lines(selected_lines: list[str], question: str) -> str | None:
    cleaned = []
    seen = set()
    for line in selected_lines:
        normalized, is_question_line = _strip_qa_prefix(line)
        if is_question_line:
            continue
        if _is_repeated_question_line(normalized, question):
            continue
        if len(normalized) < 8 or normalized.startswith("0 VND"):
            continue
        normalized_key = _normalize_for_compare(normalized)
        duplicate_key = None
        for seen_item in seen:
            seen_key = _normalize_for_compare(seen_item)
            if normalized_key and seen_key and (
                normalized_key.startswith(seen_key)
                or seen_key.startswith(normalized_key)
            ):
                duplicate_key = seen_item
                break
        if duplicate_key:
            if len(normalized) > len(duplicate_key):
                seen.remove(duplicate_key)
                cleaned = [item for item in cleaned if item != f"- {duplicate_key}"]
            else:
                continue
        if normalized and normalized not in seen:
            seen.add(normalized)
            cleaned.append(f"- {normalized}")

    return "\n".join(cleaned) if cleaned else None


def _try_answer_from_faq_lines(question: str, lines: list[str]) -> str | None:
    question_terms = _question_lookup_terms(question)
    if not question_terms:
        return None

    best_index = None
    best_overlap = 0
    for index, line in enumerate(lines):
        stripped, is_question_line = _strip_qa_prefix(line)
        if not is_question_line and _is_repeated_question_line(stripped, question):
            is_question_line = True
        if not is_question_line:
            continue
        line_terms = _question_lookup_terms(stripped)
        overlap = len(question_terms & line_terms)
        if overlap >= best_overlap:
            best_overlap = overlap
            best_index = index

    if best_index is None or best_overlap < max(2, min(4, len(question_terms))):
        return None

    answer_lines: list[str] = []
    for line in lines[best_index + 1:best_index + 5]:
        stripped, is_question_line = _strip_qa_prefix(line)
        if is_question_line:
            break
        if stripped:
            answer_lines.append(stripped)
            break

    return _format_plain_answer_lines(answer_lines, question)


def _try_answer_from_section_lines(question: str, lines: list[str]) -> str | None:
    q_fold = _fold_for_match(question)
    if not any(marker in q_fold for marker in ("chinhsach", "dichvu", "dieukien")):
        return None

    question_terms = _question_lookup_terms(question)
    if not question_terms:
        return None

    best_index = None
    best_overlap = 0
    for index, line in enumerate(lines):
        normalized, _ = _strip_qa_prefix(line)
        heading = re.sub(r"^\d+\.\s*", "", normalized).strip()
        if not re.match(r"^\d+\.", line.strip()) and not heading.endswith(":"):
            continue
        heading_terms = _question_lookup_terms(heading)
        overlap = len(question_terms & heading_terms)
        if overlap > best_overlap:
            best_overlap = overlap
            best_index = index

    if best_index is None or best_overlap < max(2, min(4, len(question_terms))):
        return None

    selected: list[str] = []
    for line in lines[best_index + 1:best_index + 9]:
        stripped = line.strip()
        if re.match(r"^\d+\.", stripped):
            break
        if selected and stripped.endswith(":"):
            break
        _, is_question_line = _strip_qa_prefix(stripped)
        if is_question_line:
            break
        selected.append(stripped)

    return _format_plain_answer_lines(selected, question)


def _try_answer_from_plain_text_context(question: str, chunks: list[dict]) -> str | None:
    q_norm = _normalize_for_compare(question)
    q_words = _tokenize_for_rank(question)
    if not q_norm or not q_words:
        return None

    normalized_terms = {_normalize_for_compare(term) for term in q_words}
    normalized_terms = {term for term in normalized_terms if len(term) > 1}
    if not normalized_terms:
        return None

    ordered_chunks = sorted(
        chunks,
        key=lambda item: (
            str(item.get("source_document_id") or ""),
            int(item.get("chunk_index") or 0),
        ),
    )
    lines: list[str] = []
    for chunk in ordered_chunks:
        lines.extend(_plain_text_lines(str(chunk.get("chunk_text") or "")))

    if not lines:
        return None

    section_answer = _try_answer_from_section_lines(question, lines)
    if section_answer:
        return section_answer

    faq_answer = _try_answer_from_faq_lines(question, lines)
    if faq_answer:
        return faq_answer

    phone_terms = ("dienthoai", "điệnthoại")
    warranty_terms = ("baohanh", "bảohành")
    if any(term in q_norm for term in phone_terms) and any(term in q_norm for term in warranty_terms):
        phone_index = next(
            (
                index
                for index, line in enumerate(lines)
                if any(term in _normalize_for_compare(line) for term in phone_terms)
                and line.strip().endswith(":")
            ),
            None,
        )
        if phone_index is not None:
            selected = lines[phone_index:phone_index + 3]
            answer = _format_plain_answer_lines(selected, question)
            if answer:
                return answer

    phrases = []
    for phrase in (
        "bao hanh", "bảo hành", "dien thoai", "điện thoại", "giao hang", "giao hàng",
        "noi thanh", "nội thành", "ha noi", "hà nội", "doi tra", "đổi trả",
        "thanh toan", "thanh toán", "lap dat", "lắp đặt", "tra gop", "trả góp",
        "cai dat", "cài đặt", "ung dung", "ứng dụng",
    ):
        phrase_norm = _normalize_for_compare(phrase)
        if phrase_norm and phrase_norm in q_norm:
            phrases.append(phrase_norm)

    def line_score(line: str) -> int:
        line_norm = _normalize_for_compare(line)
        if line_norm.startswith(("hoi", "hỏi")):
            return 0
        score = sum(1 for term in normalized_terms if term in line_norm)
        score += sum(8 for phrase in phrases if phrase in line_norm)
        if line_norm.startswith(("traloi", "trảlời")):
            score += 5
        if any(term in line_norm for term in normalized_terms) and re.match(r"^\d+\.", line.strip()):
            score += 3
        return score

    scored_lines = [(line_score(line), index) for index, line in enumerate(lines)]
    best_score, best_index = max(scored_lines, key=lambda item: item[0])
    if best_score < 3:
        return None

    start = best_index
    for index in range(best_index, max(-1, best_index - 9), -1):
        candidate = lines[index].strip()
        if re.match(r"^\d+\.", candidate) and line_score(candidate) > 0:
            start = index
            break
        if candidate.endswith(":") and line_score(candidate) > 0:
            start = index
            break
    else:
        start = max(0, best_index - 1)

    end = best_index + 1
    while end < len(lines) and end - start < 10:
        current = lines[end].strip()
        _, is_question_line = _strip_qa_prefix(current)
        if end > best_index and is_question_line:
            break
        if end > best_index and re.match(r"^\d+\.", current):
            break
        if end > best_index + 1 and current.endswith(":"):
            break
        end += 1

    selected_lines = lines[start:end]
    if any(term in q_norm for term in phone_terms):
        phone_index = next(
            (
                index
                for index, line in enumerate(selected_lines)
                if any(term in _normalize_for_compare(line) for term in phone_terms)
                and line.strip().endswith(":")
            ),
            None,
        )
        if phone_index is not None:
            selected_lines = selected_lines[phone_index:phone_index + 3]

    return _format_plain_answer_lines(selected_lines, question)


def _question_lookup_terms(question: str) -> set[str]:
    attribute_terms = _generic_attribute_terms()
    terms = {
        term
        for term in _tokenize_for_rank(question)
        if term not in attribute_terms and not term.isdigit()
    }
    terms.update(term.strip() for term in re.findall(r"\d+\s*(?:mah|gb|mp|inch)?", question.lower()))
    return {term for term in terms if term}


def _generic_attribute_terms() -> set[str]:
    return {
        "a", "an", "the", "là", "la", "có", "co", "không", "khong", "cho", "và", "va",
        "bao", "nhiêu", "nhieu", "bao nhiêu", "bao nhieu", "gì", "gi", "nào", "nao",
        "thế", "the", "nào", "với", "voi", "của", "cua", "tôi", "toi", "bạn", "ban",
        "xin", "hãy", "hay", "giúp", "giup", "cho biết", "cho biet", "thông", "tin",
        "nhi", "th", "ng", "kh", "tr", "li",
    }


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


def _try_product_recommend_from_markdown_table(question: str, chunks: list[dict]) -> str | None:
    rows = _parse_markdown_table_rows(_rank_context_chunks(question, chunks))
    if not rows:
        return None

    headers = rows[0].get("headers") or list(rows[0]["row"].keys())
    id_col = _find_table_column(headers, "id", "ma")
    name_col = _find_table_column(headers, "tensanpham", "sanpham", "name", "title", "ten")
    price_col = next((header for header in headers if _looks_like_money_column(header)), None)
    image_col = _find_exact_table_column(
        headers,
        "imageUrl",
        "image_url",
        "image",
        "img",
        "anh",
        "hinh_anh",
        "thumbnail",
        "thumbnail_url",
        "url_anh",
        "link_anh",
    )
    detail_col = _find_exact_table_column(
        headers,
        "detailUrl",
        "detail_url",
        "detail",
        "url",
        "link",
        "product_url",
        "duong_dan",
        "lien_ket",
    )
    if not id_col or not name_col or not price_col:
        return None

    budget = _extract_budget(question)
    query_terms = _question_lookup_terms(question) - {
        "mua", "muon", "cần", "can", "tư", "tu", "vấn", "van", "gợi", "goi", "ý", "de", "xuat",
        "chon", "chọn", "phu", "hop", "ngan", "sach", "tam", "gia", "gi",
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
        score = 0
        for term in query_terms:
            term_norm = _normalize_for_compare(term)
            if term_norm and term_norm in row_norm:
                score += 2
        if budget is not None:
            score += max(0, 100000000 - abs(budget - price)) / 100000000

        candidates.append((score, price, row, product_id, name))

    if not candidates:
        return None

    candidates.sort(key=lambda item: (item[0], item[1]), reverse=True)
    products = []
    for _, _, row, product_id, name in candidates[:3]:
        price = _parse_number(row.get(price_col, "")) or 0
        products.append(
            {
                "id": product_id,
                "name": name,
                "price": price,
                "imageUrl": row.get(image_col, "") if image_col else "",
                "detailUrl": row.get(detail_col, "") if detail_col else "",
                "reason": row.get(_find_table_column(headers, "mota", "description", "phuhop", "reason") or "", "")
                          or "Sản phẩm này phù hợp với thông tin bạn yêu cầu.",
            }
        )

    intro = "Mình gợi ý một số sản phẩm phù hợp với nhu cầu của bạn:"
    return (
        intro
        + "\n__JSON_PRODUCTS__\n"
        + json.dumps(products, ensure_ascii=False, indent=2)
        + "\n__END_JSON__"
    )


def _try_answer_from_markdown_table(question: str, chunks: list[dict]) -> str | None:
    rows = _parse_markdown_table_rows(_rank_context_chunks(question, chunks))
    if not rows:
        return None

    q_norm = _normalize_for_compare(question)
    q_terms = _question_lookup_terms(question)

    def row_score(item: dict) -> int:
        row_text_norm = _normalize_for_compare(item["text"])
        score = 0
        for term in q_terms:
            term_norm = _normalize_for_compare(term)
            if term_norm and term_norm in row_text_norm:
                score += 2
        display_name_norm = _normalize_for_compare(_row_display_name(item["row"]))
        if display_name_norm and display_name_norm in q_norm:
            score += 8
        return score

    scored = [(row_score(item), item) for item in rows]
    strict_matched = []
    if len(q_terms) >= 2:
        strict_matched = [
            item
            for _, item in scored
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


def _is_obvious_out_of_scope(question: str) -> bool:
    """Không chặn theo keyword lĩnh vực vì KB có thể thuộc bất kỳ domain nào."""
    return False


def _is_plain_greeting(question: str) -> bool:
    normalized = _normalize_for_compare(question)
    return normalized in {
        "hi",
        "hello",
        "helo",
        "hey",
        "chao",
        "xincha",
        "xinchao",
        "chaoban",
        "xinchaoban",
    }


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


def _remove_repeated_question(answer: str, question: str | None) -> str:
    if not question:
        return answer.strip()

    cleaned = answer.strip()
    question_key = _normalize_for_compare(question)
    if not question_key:
        return cleaned

    lines = cleaned.splitlines()
    while lines and not lines[0].strip():
        lines.pop(0)
    if lines:
        first_line = re.sub(r"^\s*[-*]\s*", "", lines[0]).strip()
        first_line = re.sub(r"^\s*(?:câu hỏi|cau hoi|question)\s*[:：-]\s*", "", first_line, flags=re.IGNORECASE).strip()
        first_line = first_line.rstrip(":：")
        if _is_repeated_question_line(first_line, question):
            return "\n".join(lines[1:]).strip()

    return cleaned


def _normalize_answer_text(answer: str, question: str | None = None) -> str:
    cleaned = (answer or "").strip()
    if not cleaned:
        return cleaned

    cleaned = _remove_repeated_question(cleaned, question)

    if cleaned == KB_NOT_FOUND_MARKER:
        return KB_NOT_FOUND_ANSWER

    if KB_NOT_FOUND_MARKER in cleaned:
        cleaned = cleaned.replace(KB_NOT_FOUND_MARKER, "").strip()
        if not cleaned:
            return KB_NOT_FOUND_ANSWER

    if cleaned == KB_NOT_FOUND_ANSWER:
        return KB_NOT_FOUND_ANSWER

    if cleaned.startswith(KB_NOT_FOUND_ANSWER):
        remainder = cleaned[len(KB_NOT_FOUND_ANSWER):].strip()
        return remainder or KB_NOT_FOUND_ANSWER

    legacy_not_found_answers = {
        "Xin lỗi, tôi không tìm thấy thông tin phù hợp.",
        "Không tìm thấy thông tin trong tài liệu.",
    }
    if cleaned in legacy_not_found_answers:
        return KB_NOT_FOUND_ANSWER

    lowered = cleaned.lower()
    if "không tìm thấy thông tin" in lowered or "không có thông tin" in lowered:
        return KB_NOT_FOUND_ANSWER

    contact_deflection_patterns = [
        "gọi điện để biết",
        "gọi để biết",
        "liên hệ để biết",
        "để biết thêm chi tiết",
        "để được cập nhật",
        "cập nhật thông tin mới nhất",
    ]
    if any(pattern in lowered for pattern in contact_deflection_patterns):
        return KB_NOT_FOUND_ANSWER

    if "marker" in lowered and (
        "không có thông tin" in lowered
        or "không tìm thấy" in lowered
        or "không thể trả lời" in lowered
    ):
        return KB_NOT_FOUND_ANSWER

    if lowered.startswith("xin lỗi") and (
        "không có thông tin" in lowered
        or "không tìm thấy" in lowered
        or "không thể trả lời" in lowered
    ):
        paragraphs = [part.strip() for part in re.split(r"\n\s*\n", cleaned) if part.strip()]
        if len(paragraphs) > 1:
            return "\n\n".join(paragraphs[1:]).strip()
        return KB_NOT_FOUND_ANSWER

    return cleaned


