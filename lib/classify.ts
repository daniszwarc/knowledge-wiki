"use server";

import { cookies } from "next/headers";

const PIPELINE_URL = process.env.PIPELINE_URL ?? "http://localhost:8001";
const INTERNAL_URL = process.env.INTERNAL_URL ?? "http://localhost:3000";

export interface ClassifyResult {
  doc_type: string;
  confidence: number;
  needs_review: number;
}

/**
 * Extracts up to the first 2000 characters of text from a file via the
 * pipeline's /extract-text endpoint (no DB/disk writes). Falls back to the
 * filename if extraction fails or the file type isn't supported.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  try {
    const fd = new FormData();
    fd.append("file", file, file.name);
    const res = await fetch(`${PIPELINE_URL}/extract-text`, { method: "POST", body: fd });
    if (!res.ok) return file.name;
    const json = await res.json();
    const text = typeof json.text === "string" ? json.text.trim() : "";
    return text ? text.slice(0, 2000) : file.name;
  } catch {
    return file.name;
  }
}

/** Calls /api/classify to get a Jev-based doc type classification. Throws on failure — callers decide the fallback. */
export async function classifyFile(text: string, filename: string): Promise<ClassifyResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("wiki_session")?.value;

  const res = await fetch(`${INTERNAL_URL}/api/classify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { cookie: `wiki_session=${token}` } : {}),
    },
    body: JSON.stringify({ text, filename }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Classify failed: ${detail}`);
  }
  return res.json();
}
