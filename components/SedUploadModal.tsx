"use client";

import { useRef, useState } from "react";

interface SedUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function SedUploadModal({ onClose, onSuccess }: SedUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ ticket_number: string; project_title: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".docx")) {
      setError("Only .docx files are accepted.");
      return;
    }
    setError(null);
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("owner_name", ownerName.trim());
      fd.append("owner_email", ownerEmail.trim());

      const res = await fetch("/api/seds/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Upload failed");
      }
      const data = await res.json() as { ticket_number: string; project_title: string };
      setSuccess(data);
      onSuccess();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

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
          borderRadius: 10, padding: 28, width: 420, maxWidth: "90vw",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            Upload SED
          </h2>
          <button
            onClick={onClose}
            style={{ fontSize: 18, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {success ? (
          <div>
            <p style={{ fontSize: 13, color: "#15803d", marginBottom: 8 }}>
              ✓ SED uploaded successfully
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
              <strong>Ticket:</strong> {success.ticket_number}
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>
              <strong>Title:</strong> {success.project_title}
            </p>
            <button
              onClick={onClose}
              style={{
                fontSize: 12, padding: "6px 16px", borderRadius: 6,
                border: "1px solid var(--card-border)", background: "none",
                color: "var(--muted)", cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "var(--foreground)" : "var(--card-border)"}`,
                borderRadius: 8, padding: "20px 16px", textAlign: "center",
                cursor: "pointer", transition: "border-color 0.15s",
                background: dragging ? "var(--card-hover-bg)" : "none",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".docx"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {file ? (
                <p style={{ fontSize: 12, color: "var(--foreground)", margin: 0 }}>
                  📄 {file.name}
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 4px" }}>
                    Drop a .docx file here or click to browse
                  </p>
                  <p style={{ fontSize: 11, color: "var(--muted-light)", margin: 0 }}>
                    .docx only
                  </p>
                </>
              )}
            </div>

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
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                style={{
                  fontSize: 12, padding: "6px 16px", borderRadius: 6,
                  border: "1px solid var(--card-border)",
                  background: !file || uploading ? "var(--sidebar-bg)" : "var(--foreground)",
                  color: !file || uploading ? "var(--muted-light)" : "var(--background)",
                  cursor: !file || uploading ? "not-allowed" : "pointer",
                  fontWeight: 500,
                }}
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
