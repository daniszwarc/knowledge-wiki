MAX_CHUNK_SIZE = 2000
MIN_CHUNK_SIZE = 50


def chunk_text(text: str) -> list[str]:
    raw_chunks = text.split("\n\n")
    chunks = []
    for block in raw_chunks:
        block = block.strip()
        if not block:
            continue
        if len(block) > MAX_CHUNK_SIZE:
            sub_chunks = block.split("\n")
            for sub in sub_chunks:
                sub = sub.strip()
                if len(sub) >= MIN_CHUNK_SIZE:
                    chunks.append(sub)
        elif len(block) >= MIN_CHUNK_SIZE:
            chunks.append(block)
    return chunks
