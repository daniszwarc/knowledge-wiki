from typing import Optional
import base64
import io
from dataclasses import dataclass, field
from pathlib import Path

import fitz  # PyMuPDF
from docx import Document
from fastapi import HTTPException


@dataclass
class DocumentContent:
    raw_text: str
    pages: int
    format: str
    filename: str
    images: dict = field(default_factory=dict)


def load_pdf(data: bytes, filename: str, job_id: Optional[str] = None, uploads_dir: Optional[Path] = None) -> DocumentContent:
    doc = fitz.open(stream=data, filetype="pdf")
    pages_text = []
    for page in doc:
        # Extract with layout preservation
        blocks = page.get_text("blocks")
        # Sort blocks top-to-bottom, left-to-right
        blocks.sort(key=lambda b: (round(b[1]/20)*20, b[0]))
        page_text = "\n".join(
            b[4].strip() for b in blocks
            if b[4].strip() and b[6] == 0  # b[6]==0 means text block
        )
        pages_text.append(page_text)

    image_map: dict = {}
    if job_id and uploads_dir:
        img_dir = uploads_dir
        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list):
                try:
                    xref = img[0]
                    pix = fitz.Pixmap(doc, xref)
                    if pix.width < 100 or pix.height < 100:
                        continue
                    if pix.n - pix.alpha > 3:
                        pix = fitz.Pixmap(fitz.csRGB, pix)
                    img_filename = f"page{page_num + 1}_img{img_index + 1}.png"
                    img_path = img_dir / img_filename
                    img_dir.mkdir(parents=True, exist_ok=True)
                    pix.save(str(img_path))
                    figure_key = f"Figure {len(image_map) + 1}"
                    image_map[figure_key] = f"/uploads/{job_id}/{img_filename}"
                except Exception:
                    continue

    doc.close()
    return DocumentContent(
        raw_text="\n".join(pages_text),
        pages=len(pages_text),
        format="pdf",
        filename=filename,
        images=image_map,
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


def load_document(data: bytes, filename: str, job_id: Optional[str] = None, uploads_dir: Optional[Path] = None) -> DocumentContent:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return load_pdf(data, filename, job_id=job_id, uploads_dir=uploads_dir)
    elif lower.endswith(".docx"):
        return load_docx(data, filename)
    elif lower.endswith(".txt"):
        return load_txt(data, filename)
    else:
        raise HTTPException(status_code=415, detail=f"Unsupported file format: {filename}")
