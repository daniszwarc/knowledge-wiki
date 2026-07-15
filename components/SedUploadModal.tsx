"use client";

import { useEffect, useRef, useState } from "react";

interface SedUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Company {
  id: string;
  name: string;
}

type FileStatus = "pending" | "processing" | "success" | "error";

interface QueuedFile {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
  ticketNumber?: string;
}

export function SedUploadModal({ onClose, onSuccess }: SedUploadModalProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/companies/user")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Company[]) => setCompanies(data));
  }, []);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const accepted: QueuedFile[] = [];
    let rejected = false;
    for (const f of files) {
      if (!f.name.toLowerCase().endsWith(".docx")) {
        rejected = true;
        continue;
      }
      accepted.push({ id: `${f.name}-${f.lastModified}-${Math.random()}`, file: f, status: "pending" });
    }
    setError(rejected ? "Only .docx files are accepted; non-.docx files were skipped." : null);
    if (accepted.length > 0) {
      setQueue((prev) => [...prev, ...accepted]);
      setDone(false);
    }
  }

  async function handleUpload() {
    if (queue.length === 0 || uploading) return;
    setUploading(true);
    setDone(false);
    setError(null);

    for (const item of queue) {
      if (item.status === "success") continue;

      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "processing", error: undefined } : q)));

      try {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("owner_name", ownerName.trim());
        fd.append("owner_email", ownerEmail.trim());
        if (selectedCompany === "all") {
          fd.append("is_corporate", "true");
        } else {
          fd.append("is_corporate", "false");
          fd.append("company_id", selectedCompany);
        }

        const res = await fetch("/api/seds/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error ?? "Upload failed");
        }
        const data = await res.json() as { ticket_number: string; project_title: string };
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "success", ticketNumber: data.ticket_number } : q))
        );
      } catch (e) {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: (e as Error).message } : q))
        );
      }
    }

    setUploading(false);
    setDone(true);
    onSuccess();
  }

  const succeeded = queue.filter((q) => q.status === "success").length;
  const failed = queue.filter((q) => q.status === "error").length;

  const statusColors: Record<FileStatus, { bg: string; fg: string; label: string }> = {
    pending: { bg: "var(--sidebar-bg)", fg: "var(--muted)", label: "pending" },
    processing: { bg: "#fef9c3", fg: "#854d0e", label: "processing" },
    success: { bg: "#dcfce7", fg: "#15803d", label: "success" },
    error: { bg: "#fee2e2", fg: "#b91c1c", label: "error" },
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--background)", border: "1px solid var(--card-border)",
          borderRadius: 10, padding: 28, width: 460, maxWidth: "90vw",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          maxHeight: "85vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            Upload SEDs
          </h2>
          <button
            onClick={onClose}
            style={{ fontSize: 18, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "var(--foreground)" : "var(--card-border)"}`,
              borderRadius: 8, padding: "20px 16px", textAlign: "center",
              cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
              background: dragging ? "var(--card-hover-bg)" : "none",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".docx"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 4px" }}>
              Drop .docx files here or click to browse
            </p>
            <p style={{ fontSize: 11, color: "var(--muted-light)", margin: 0 }}>
              .docx only · multiple files supported
            </p>
          </div>

          {/* File queue */}
          {queue.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
              {queue.map((q) => (
                <div
                  key={q.id}
                  style={{
                    display: "flex", flexDirection: "column", gap: 2,
                    fontSize: 12, padding: "6px 10px", borderRadius: 6,
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      📄 {q.file.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                        background: statusColors[q.status].bg, color: statusColors[q.status].fg,
                        textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap",
                      }}
                    >
                      {statusColors[q.status].label}
                    </span>
                  </div>
                  {q.status === "error" && q.error && (
                    <span style={{ fontSize: 11, color: "#b91c1c" }}>{q.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {done && queue.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--foreground)", margin: 0, fontWeight: 600 }}>
              {succeeded} succeeded, {failed} failed
            </p>
          )}

          {/* Owner name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Owner name
            </label>
            <input
              className="search-input"
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Jane Smith"
              style={{ width: "100%", fontSize: 13, padding: "6px 10px", borderRadius: 6, boxSizing: "border-box" }}
            />
          </div>

          {/* Owner email */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Owner email
            </label>
            <input
              className="search-input"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="e.g. jane@company.com"
              style={{ width: "100%", fontSize: 13, padding: "6px 10px", borderRadius: 6, boxSizing: "border-box" }}
            />
          </div>

          {/* Company */}
          {companies.length > 0 && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Company
              </label>
              <select
                className="search-input"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                style={{ width: "100%", fontSize: 13, padding: "6px 10px", borderRadius: 6, boxSizing: "border-box" }}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p style={{ fontSize: 12, color: "#b91c1c", margin: 0 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                fontSize: 12, padding: "6px 14px", borderRadius: 6,
                border: "1px solid var(--card-border)", background: "none",
                color: "var(--muted)", cursor: "pointer",
              }}
            >
              {done ? "Close" : "Cancel"}
            </button>
            <button
              onClick={handleUpload}
              disabled={queue.length === 0 || uploading}
              style={{
                fontSize: 12, padding: "6px 16px", borderRadius: 6,
                border: "1px solid var(--card-border)",
                background: queue.length === 0 || uploading ? "var(--sidebar-bg)" : "var(--foreground)",
                color: queue.length === 0 || uploading ? "var(--muted-light)" : "var(--background)",
                cursor: queue.length === 0 || uploading ? "not-allowed" : "pointer",
                fontWeight: 500,
              }}
            >
              {uploading ? "Uploading…" : `Upload ${queue.length > 0 ? `(${queue.length})` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
