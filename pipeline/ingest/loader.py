import io
from dataclasses import dataclass

import fitz  # PyMuPDF
from docx import Document
from fastapi import HTTPException


@dataclass
class DocumentContent:
    raw_text: str
    pages: int
    format: str
    filename: str


def load_pdf(data: bytes, filename: str) -> DocumentContent:
    doc = fitz.open(stream=data, filetype="pdf")
    pages_text = []
    for page in doc:
        pages_text.append(page.get_text())
    doc.close()
    return DocumentContent(
        raw_text="\n".join(pages_text),
        pages=len(pages_text),
        format="pdf",
        filename=filename,
    )


def load_docx(data: bytes, filename: str) -> DocumentContent:
    doc = Document(io.BytesIO(data))
    parts = []
    for para in doc.paragraphs:
        if para.text.strip():
            parts.append(para.text)
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                parts.append(row_text)
    return DocumentContent(
        raw_text="\n".join(parts),
        pages=len(doc.paragraphs),
        format="docx",
        filename=filename,
    )


def load_txt(data: bytes, filename: str) -> DocumentContent:
    text = data.decode("utf-8", errors="replace")
    lines = text.splitlines()
    return DocumentContent(
        raw_text=text,
        pages=len(lines),
        format="txt",
        filename=filename,
    )


def load_document(data: bytes, filename: str) -> DocumentContent:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return load_pdf(data, filename)
    elif lower.endswith(".docx"):
        return load_docx(data, filename)
    elif lower.endswith(".txt"):
        return load_txt(data, filename)
    else:
        raise HTTPException(status_code=415, detail=f"Unsupported file format: {filename}")
