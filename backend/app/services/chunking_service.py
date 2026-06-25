import re


def clean_text(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text or "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(text: str, target_tokens: int = 650, overlap_tokens: int = 120) -> list[dict]:
    tokens = clean_text(text).split()
    if not tokens:
        return []
    chunks = []
    start = 0
    index = 1
    while start < len(tokens):
        end = min(len(tokens), start + target_tokens)
        chunk_tokens = tokens[start:end]
        chunks.append(
            {
                "chunk_index": index,
                "text": " ".join(chunk_tokens),
                "token_count": len(chunk_tokens),
                "page_start": index,
                "page_end": index,
                "section_title": "",
            }
        )
        if end >= len(tokens):
            break
        start = max(0, end - overlap_tokens)
        index += 1
    return chunks
