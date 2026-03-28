MAX_CHUNK_SIZE = 4000
MIN_CHUNK_SIZE = 50
MAX_CHUNKS = 10


def chunk_text(text: str) -> list[str]:
    raw_chunks = text.split("\n\n")
    paragraphs = []
    for block in raw_chunks:
        block = block.strip()
        if not block:
            continue
        if len(block) > MAX_CHUNK_SIZE:
            sub_chunks = block.split("\n")
            for sub in sub_chunks:
                sub = sub.strip()
                if len(sub) >= MIN_CHUNK_SIZE:
                    paragraphs.append(sub)
        elif len(block) >= MIN_CHUNK_SIZE:
            paragraphs.append(block)

    # Merge paragraphs into larger chunks to reduce LLM calls
    chunks = []
    current = ""
    for para in paragraphs:
        if current and len(current) + len(para) + 2 > MAX_CHUNK_SIZE:
            chunks.append(current)
            current = para
        else:
            current = (current + "\n\n" + para).strip() if current else para
    if current:
        chunks.append(current)

    return chunks[:MAX_CHUNKS]
