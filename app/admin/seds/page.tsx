"use client";

import { useState } from "react";

export default function AdminSedsPage() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleDeleteAll() {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/admin/seds", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to delete SEDs");
        return;
      }
      setSuccessMessage(`Deleted ${data.deletedCount} SED(s) and their embeddings.`);
      setConfirming(false);
    } catch {
      setError("Failed to delete SEDs");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--sidebar-border)", padding: "16px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>← Home</a>
        <span style={{ color: "var(--muted-light)", opacity: 0.4 }}>·</span>
        <a href="/admin/users" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>User management</a>
        <span style={{ color: "var(--muted-light)", opacity: 0.4 }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>SED management</span>
      </div>

      <div style={{ maxWidth: 860, width: "100%", padding: "32px 32px 64px" }}>
        <div style={{ border: "1px solid var(--card-border)", borderRadius: 10, padding: 20, background: "var(--card-bg)" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)", marginBottom: 6 }}>
            Delete all SEDs
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 14px" }}>
            Permanently deletes every SED and its associated embeddings. This cannot be undone.
          </p>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={loading}
              style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", cursor: "pointer", fontWeight: 500 }}
            >
              Delete all SEDs
            </button>
          ) : (
            <div>
              <p style={{ fontSize: 12, color: "#b91c1c", fontWeight: 500, margin: "0 0 10px" }}>
                Are you sure? This will permanently delete all SEDs and their embeddings.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleDeleteAll}
                  disabled={loading}
                  style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", cursor: "pointer", fontWeight: 500 }}
                >
                  {loading ? "Deleting…" : "Yes, delete all"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={loading}
                  style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && <p style={{ fontSize: 12, color: "#b91c1c", margin: "12px 0 0" }}>{error}</p>}
          {successMessage && <p style={{ fontSize: 12, color: "#15803d", margin: "12px 0 0" }}>{successMessage}</p>}
        </div>
      </div>
    </div>
  );
}
