import base64
import os
from pathlib import Path

import fitz  # PyMuPDF
import requests

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
VISION_MODEL = "llama3.2-vision:11b"


def extract_and_save_images(
    doc: fitz.Document,
    upload_dir: Path,
    job_id: str,
) -> dict:
    image_map = {}
    img_counter = 1

    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images(full=True)

        for img in image_list:
            try:
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)

                if pix.width < 100 or pix.height < 100:
                    continue

                if pix.n - pix.alpha > 3:
                    pix = fitz.Pixmap(fitz.csRGB, pix)

                img_filename = f"figure_{img_counter}.png"
                img_path = upload_dir / img_filename
                upload_dir.mkdir(parents=True, exist_ok=True)
                pix.save(str(img_path))

                image_map[f"Figure {img_counter}"] = f"/uploads/{job_id}/{img_filename}"
                img_counter += 1

            except Exception:
                continue

    return image_map


def describe_image(img_path: Path, fig_key: str) -> str:
    with open(img_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": VISION_MODEL,
                "prompt": (
                    "Describe this image in one sentence. "
                    "Focus on what it shows functionally "
                    "(e.g. a data entry form, a report output, "
                    "a calendar date picker). Be specific about "
                    "field names and data visible."
                ),
                "images": [img_b64],
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 100,
                },
            },
            timeout=120,
        )
        return response.json().get("response", "").strip()
    except Exception:
        return fig_key


def process_article_images(
    data: bytes,
    job_id: str,
    upload_dir: Path,
) -> dict:
    doc = fitz.open(stream=data, filetype="pdf")
    image_map = extract_and_save_images(doc, upload_dir, job_id)
    doc.close()

    enriched_map = {}
    for fig_key, img_url in image_map.items():
        img_filename = img_url.split("/")[-1]
        img_path = upload_dir / img_filename
        description = describe_image(img_path, fig_key)
        enriched_map[fig_key] = {
            "url": img_url,
            "caption": description,
        }

    return enriched_map
