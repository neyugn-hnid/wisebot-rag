"""
Stopwords tập trung cho toàn bộ ai-service.
Tránh duplicate, dễ maintain, dễ mở rộng.
"""

# ── Stopwords cho tokenize / rank ──────────────────────────────────────
RANK_STOPWORDS: set[str] = {
    "a", "an", "the", "is", "are", "to", "of", "for", "and", "or",
    "la", "co", "cua", "cho", "va", "voi", "toi", "ban", "bao", "nhieu",
    "the", "nao", "gi", "khong", "hay", "duoc", "mua",
}

# ── Stopwords nhẹ cho content terms (giữ lại keyword quan trọng) ──────
LIGHT_STOPWORDS: set[str] = {
    "cua", "hang", "co", "khong", "duoc", "bao", "lau", "thi", "nhan",
    "hoi", "tra", "loi", "mua", "ban",
}

# ── Stopwords cho phrase extraction ────────────────────────────────────
PHRASE_STOPWORDS: set[str] = {
    "a", "an", "the", "la", "co", "cua", "cho", "va", "voi", "toi", "ban",
    "bao", "lau", "nhieu", "the", "nao", "gi", "khong", "hay", "duoc",
    "mua", "hoi", "tra", "loi", "thi",
}

# ── Stopwords tiếng Việt cho hybrid search ────────────────────────────
VIETNAMESE_STOPWORDS: set[str] = {
    "ai",
    "bao",
    "bao nhieu",
    "cac",
    "co",
    "có",
    "cua",
    "của",
    "duoc",
    "được",
    "gi",
    "gì",
    "khi",
    "khong",
    "không",
    "la",
    "lau",
    "lâu",
    "nao",
    "nào",
    "o",
    "ở",
    "thi",
    "thì",
    "trong",
    "tu",
    "từ",
    "va",
    "và",
    "ve",
    "về",
}

# ── Greetings ──────────────────────────────────────────────────────────
GREETINGS: set[str] = {
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

# ── Câu hỏi Hỏi/Trả lời markers ───────────────────────────────────────
QA_MARKERS: set[str] = {"traloi", "dap", "answer"}

# ── Markers cho sản phẩm table ────────────────────────────────────────
PRODUCT_TABLE_MARKERS: set[str] = {
    "ten\\_san\\_pham", "ten_san_pham", "gia\\_vnd",
    "gia_vnd", "image\\_url", "detail\\_url",
}
