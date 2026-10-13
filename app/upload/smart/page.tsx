"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { extractTextFromFile, classifyFile } from "@/lib/classify";

interface Me {
  id: string;
  email: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
}

type DocType = "rules" | "article" | "sed" | "video";

const DOC_TYPE_META: Record<DocType, { icon: string; label: string }> = {
  rules: { icon: "📋", label: "Process Doc" },
  article: { icon: "📄", label: "Article" },
  sed: { icon: "🔧", label: "SED" },
  video: { icon: "🎬", label: "Video" },
};

// Jev's doc_type choice ids map 1:1 to our DocType values except "process" -> "rules"
function normalizeDocType(raw: string | null): DocType | null {
  if (raw === "process") return "rules";
  if (raw === "article" || raw === "sed" || raw === "video") return raw;
  return null;
}

type ClassifyStatus = "classifying" | "done" | "error";
type UploadStatus = "pending" | "processing" | "success" | "error";

interface SmartFileItem {
  id: string;
  file: File;
  classifyStatus: ClassifyStatus;
  classifyError?: string;
  autoDocType: DocType | null;
  confidence: number | null;
  needsReview: number | null;
  overrideDocType: DocType | null;
  embedUrl: string;
  uploadStatus: UploadStatus;
  uploadError?: string;
  resultId?: string;
  resultLabel?: string;
}

function makeSmartItem(file: File): SmartFileItem {
  return {
    id: `${file.name}-${file.lastModified}-${Math.random()}`,
    file,
    classifyStatus: "classifying",
    autoDocType: null,
    confidence: null,
    needsReview: null,
    overrideDocType: null,
    embedUrl: "",
    uploadStatus: "pending",
  };
}

function effectiveDocType(item: SmartFileItem): DocType | null {
  return item.overrideDocType ?? item.autoDocType;
}

function isLocked(item: SmartFileItem): boolean {
  return (
    item.classifyStatus === "done" &&
    item.autoDocType !== null &&
    item.overrideDocType === null &&
    (item.confidence ?? 0) >= 0.85 &&
    (item.needsReview ?? 1) <= 0.6
  );
}

function needsOverrideUI(item: SmartFileItem): boolean {
  if (item.classifyStatus === "classifying") return false;
  if (item.classifyStatus === "error") return true;
  return !isLocked(item);
}

function deriveTitleFromFilename(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, "");
  return withoutExt.replace(/[_-]+/g, " ").trim() || filename;
}

const UPLOAD_ENDPOINT: Record<DocType, string> = {
  rules: "/api/upload/process",
  article: "/api/upload/article",
  sed: "/api/upload/sed",
  video: "/api/upload/video",
};

const STATUS_COLORS: Record<UploadStatus, { bg: string; fg: string }> = {
  pending: { bg: "var(--sidebar-bg)", fg: "var(--muted)" },
  processing: { bg: "#fef9c3", fg: "#854d0e" },
  success: { bg: "#dcfce7", fg: "#15803d" },
  error: { bg: "#fee2e2", fg: "#b91c1c" },
};

export default function SmartUploadPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const [files, setFiles] = useState<SmartFileItem[]>([]);
  const [department, setDepartment] = useState("");
  const [company, setCompany] = useState("all");
  const [title, setTitle] = useState("");
  const [appearsAs, setAppearsAs] = useState<Set<string>>(new Set(["how_to_guide"]));

  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{ succeeded: number; failed: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Me | null) => {
        if (!data) { router.push("/login"); return; }
        if (["viewer", "validator"].includes(data.role)) { router.push("/"); return; }
        setMe(data);
        setAuthLoading(false);
      });
  }, [router]);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: string[]) => setDepartments(data));

    fetch("/api/companies/user")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Company[]) => setCompanies(data));
  }, []);

  if (authLoading) return null;

  async function runClassification(item: SmartFileItem) {
    try {
      const text = await extractTextFromFile(item.file);
      const result = await classifyFile(text, item.file.name);
      const docType = normalizeDocType(result.doc_type);
      setFiles((prev) => prev.map((f) => (f.id === item.id
        ? {
            ...f,
            classifyStatus: "done",
            autoDocType: docType,
            confidence: result.confidence,
            needsReview: result.needs_review,
          }
        : f)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Classification failed";
      setFiles((prev) => prev.map((f) => (f.id === item.id
        ? { ...f, classifyStatus: "error", classifyError: message }
        : f)));
    }
  }

  function addFiles(newFiles: File[]) {
    if (newFiles.length === 0) return;
    const items = newFiles.map(makeSmartItem);
    setFiles((prev) => [...prev, ...items]);
    setSummary(null);
    setError("");
    for (const item of items) {
      runClassification(item);
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function setOverride(id: string, docType: DocType | null) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, overrideDocType: docType } : f)));
  }

  function setEmbedUrl(id: string, url: string) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, embedUrl: url } : f)));
  }

  function toggleAppearsAs(tag: string) {
    setAppearsAs((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        if (next.size > 1) next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function appendCompanyFields(fd: FormData) {
    if (company === "all") {
      fd.append("is_corporate", "true");
    } else {
      fd.append("is_corporate", "false");
      fd.append("company_id", company);
    }
  }

  const isSingleFile = files.length === 1;
  const singleEffectiveType = isSingleFile ? effectiveDocType(files[0]) : null;
  const showTitleField = isSingleFile && (singleEffectiveType === "rules" || singleEffectiveType === "article");
  const showAppearsAs = files.some((f) => effectiveDocType(f) === "article");
  const showVideoEmbedInputs = files.some((f) => effectiveDocType(f) === "video");

  function titleForItem(item: SmartFileItem): string {
    if (isSingleFile && title.trim()) return title.trim();
    return deriveTitleFromFilename(item.file.name);
  }

  function isDisabled(): boolean {
    if (loading) return true;
    if (files.length === 0) return true;
    if (!department.trim()) return true;
    if (files.some((f) => f.classifyStatus === "classifying")) return true;
    if (files.some((f) => effectiveDocType(f) === null)) return true;
    if (showVideoEmbedInputs && files.some((f) => effectiveDocType(f) === "video" && !f.embedUrl.trim())) return true;
    if (showTitleField && !title.trim()) return true;
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || isDisabled()) return;
    setLoading(true);
    setError("");
    setSummary(null);

    let succeeded = 0;
    let failed = 0;

    try {
      for (const item of files) {
        const docType = effectiveDocType(item);
        if (!docType) continue;

        setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, uploadStatus: "processing", uploadError: undefined } : f)));

        try {
          const fd = new FormData();
          const itemTitle = titleForItem(item);

          if (docType === "rules") {
            fd.append("file", item.file);
            fd.append("workflow_name", itemTitle);
            fd.append("department", department.trim());
            appendCompanyFields(fd);
          } else if (docType === "article") {
            fd.append("file", item.file);
            fd.append("title", itemTitle);
            fd.append("department", department.trim());
            fd.append("appears_as", Array.from(appearsAs).join(","));
            appendCompanyFields(fd);
          } else if (docType === "sed") {
            fd.append("file", item.file);
            appendCompanyFields(fd);
          } else {
            fd.append("srt_file", item.file);
            fd.append("title", itemTitle);
            fd.append("department", department.trim());
            fd.append("embed_url", item.embedUrl.trim());
            appendCompanyFields(fd);
          }

          const res = await fetch(UPLOAD_ENDPOINT[docType], { method: "POST", body: fd });
          if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
          const json = await res.json();
          succeeded++;

          const resultId = json.workflow_id ?? json.article_id ?? json.sed_id ?? json.video_id ?? undefined;
          const resultLabel = json.workflow_name ?? json.title ?? json.project_title ?? undefined;
          setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, uploadStatus: "success", resultId, resultLabel } : f)));
        } catch (err) {
          failed++;
          const message = err instanceof Error ? err.message : "Upload failed";
          setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, uploadStatus: "error", uploadError: message } : f)));
        }
      }

      setSummary({ succeeded, failed });
      if (department.trim()) localStorage.setItem("lastDepartment", department.trim());
      window.dispatchEvent(new Event("wiki:content-updated"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  const dropzoneBase: React.CSSProperties = {
    borderRadius: 8,
    padding: "28px 16px",
    textAlign: "center",
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
    marginBottom: 14,
  };

  const companySelectStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 14px",
    fontSize: 13,
    borderRadius: 8,
    marginBottom: 14,
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      <Sidebar me={me} />

      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "32px 40px 64px", maxWidth: 760, width: "100%" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--foreground)", marginBottom: 6, lineHeight: 1.3 }}>
              Add document (smart)
            </h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
              Drop one or more files — we&apos;ll classify each one automatically.
            </p>
          </div>

          {/* Form card */}
          <div style={{ border: "0.5px solid var(--card-border)", borderRadius: 12, padding: "24px 28px" }}>
            <form onSubmit={handleSubmit}>

              {/* Dropzone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(Array.from(e.dataTransfer.files));
                }}
                style={{ ...dropzoneBase, border: `1.5px dashed ${dragging ? "var(--foreground)" : "var(--card-border)"}`, background: dragging ? "var(--card-hover-bg)" : "var(--sidebar-bg)" }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const picked = e.target.files ? Array.from(e.target.files) : [];
                    addFiles(picked);
                    e.target.value = "";
                  }}
                />
                <span style={{ fontSize: 13, color: files.length > 0 ? "var(--foreground)" : "var(--muted-light)" }}>
                  {files.length > 0 ? `${files.length} file${files.length !== 1 ? "s" : ""} selected` : "Drop one or more files here, or click to browse"}
                </span>
                {files.length === 0 && <div style={{ fontSize: 11, color: "var(--muted-light)", marginTop: 4 }}>PDF · DOCX · TXT · VTT</div>}
              </div>

              {/* File list with classification chips */}
              {files.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {files.map((item) => {
                    const docType = effectiveDocType(item);
                    const meta = docType ? DOC_TYPE_META[docType] : null;
                    const locked = isLocked(item);
                    const showOverride = needsOverrideUI(item);
                    const chipColor = item.classifyStatus === "classifying"
                      ? { bg: "var(--sidebar-bg)", fg: "var(--muted)" }
                      : locked
                        ? { bg: "#dcfce7", fg: "#15803d" }
                        : { bg: "#fef3c7", fg: "#92400e" };

                    return (
                      <div key={item.id} style={{ border: "1px solid var(--card-border)", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 12, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                            {item.file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(item.id)}
                            style={{ fontSize: 11, color: "var(--muted-light)", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                          {item.classifyStatus === "classifying" ? (
                            <span
                              style={{
                                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                                background: chipColor.bg, color: chipColor.fg,
                              }}
                            >
                              Classifying…
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                                background: chipColor.bg, color: chipColor.fg,
                                display: "inline-flex", alignItems: "center", gap: 5,
                              }}
                            >
                              {meta ? `${meta.icon} ${meta.label}` : "Unclassified"}
                              {item.confidence !== null && ` · ${Math.round(item.confidence * 100)}%`}
                            </span>
                          )}

                          {item.classifyStatus === "error" && (
                            <span style={{ fontSize: 11, color: "#b91c1c" }}>{item.classifyError ?? "Classification failed"}</span>
                          )}

                          {showOverride && item.classifyStatus !== "classifying" && (
                            <select
                              className="search-input"
                              value={docType ?? ""}
                              onChange={(e) => setOverride(item.id, (e.target.value || null) as DocType | null)}
                              style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6 }}
                            >
                              <option value="">Choose type…</option>
                              {Object.entries(DOC_TYPE_META).map(([key, m]) => (
                                <option key={key} value={key}>{m.icon} {m.label}</option>
                              ))}
                            </select>
                          )}

                          {item.uploadStatus !== "pending" && (
                            <span
                              style={{
                                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                                background: STATUS_COLORS[item.uploadStatus].bg, color: STATUS_COLORS[item.uploadStatus].fg,
                                textTransform: "uppercase", letterSpacing: "0.04em",
                              }}
                            >
                              {item.uploadStatus}
                            </span>
                          )}
                        </div>

                        {item.uploadStatus === "error" && item.uploadError && (
                          <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 4 }}>{item.uploadError}</div>
                        )}
                        {item.uploadStatus === "success" && item.resultLabel && (
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{item.resultLabel}</div>
                        )}

                        {docType === "video" && (
                          <input
                            className="search-input"
                            required
                            value={item.embedUrl}
                            onChange={(e) => setEmbedUrl(item.id, e.target.value)}
                            placeholder="Paste SharePoint embed code or URL for this video"
                            style={{ width: "100%", padding: "7px 10px", fontSize: 12, borderRadius: 6, marginTop: 8, boxSizing: "border-box" }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {summary && (
                <p style={{ fontSize: 12, color: "var(--foreground)", margin: "0 0 14px", fontWeight: 600 }}>
                  {summary.succeeded} succeeded, {summary.failed} failed
                </p>
              )}

              {/* Title (single-file, non-SED only) */}
              {showTitleField && (
                <input
                  className="search-input"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  style={{ width: "100%", padding: "9px 14px", fontSize: 13, borderRadius: 8, marginBottom: 14, boxSizing: "border-box" }}
                />
              )}

              {/* Department (always required) */}
              <input
                className="search-input"
                list="dept-options"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Department"
                style={{ width: "100%", padding: "9px 14px", fontSize: 13, borderRadius: 8, marginBottom: 14, boxSizing: "border-box" }}
              />
              <datalist id="dept-options">
                {departments.map((d) => (<option key={d} value={d} />))}
              </datalist>

              {/* Appears under (only if any file classified as article) */}
              {showAppearsAs && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 8 }}>Appears under (applies to article files)</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { key: "how_to_guide", label: "How-to guides" },
                      { key: "training_material", label: "Training material" },
                    ].map(({ key, label }) => {
                      const active = appearsAs.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleAppearsAs(key)}
                          style={{
                            padding: "5px 14px",
                            borderRadius: 99,
                            fontSize: 12,
                            fontWeight: active ? 600 : 400,
                            border: `1px solid ${active ? "#C0D7F3" : "var(--card-border)"}`,
                            background: active ? "#E6F1FB" : "none",
                            color: active ? "#185FA5" : "var(--muted)",
                            cursor: "pointer",
                            transition: "background 0.1s, color 0.1s, border-color 0.1s",
                          }}
                        >
                          {active && <span style={{ marginRight: 5 }}>✓</span>}{label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Company */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 6 }}>Company</div>
                <select
                  className="search-input"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  style={companySelectStyle}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Submit row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <p style={{ fontSize: 12, color: "var(--muted-light)", margin: 0 }}>
                  Submitted by <strong style={{ fontWeight: 500 }}>{me?.email}</strong> · logged automatically
                </p>
                <button
                  type="submit"
                  disabled={isDisabled()}
                  style={{
                    padding: "9px 20px", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none",
                    background: "var(--foreground)", color: "var(--background)",
                    cursor: isDisabled() ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap", flexShrink: 0,
                    opacity: isDisabled() ? 0.45 : 1,
                  }}
                >
                  {loading ? "Processing…" : "Upload and process"}
                </button>
              </div>

              {error && (
                <div style={{ marginTop: 16, fontSize: 13, color: "#b91c1c" }}>{error}</div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
