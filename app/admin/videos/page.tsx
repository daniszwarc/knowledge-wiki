"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface VideoRow {
  id: string;
  title: string;
  department: string;
  created_by: string;
  created_at: string;
}

export default function AdminVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/videos").then((r) => (r.ok ? r.json() : [])),
    ]).then(([me, videoList]) => {
      if (!me || !["admin", "developer"].includes(me.role)) {
        router.push("/");
        return;
      }
      setVideos(videoList);
      setLoading(false);
    });
  }, [router]);

  async function handleDelete(id: string) {
    setDeleteLoading(true);
    try {
      await fetch(`/api/videos/${id}`, { method: "DELETE" });
      setVideos((prev) => prev.filter((v) => v.id !== id));
      setConfirmDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  function fmt(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--sidebar-border)", padding: "16px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>← Home</a>
        <span style={{ color: "var(--muted-light)", opacity: 0.4 }}>·</span>
        <a href="/admin/users" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>User management</a>
        <span style={{ color: "var(--muted-light)", opacity: 0.4 }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Video management</span>
      </div>

      <div style={{ maxWidth: 860, width: "100%", padding: "32px 32px 64px" }}>

        {loading ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p>
        ) : videos.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No videos found.</p>
        ) : (
          <div style={{ border: "1px solid var(--card-border)", borderRadius: 10, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 140px 180px 100px 120px",
              padding: "10px 16px", background: "var(--sidebar-bg)",
              borderBottom: "1px solid var(--card-border)",
              fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              <span>Title</span>
              <span>Department</span>
              <span>Created by</span>
              <span>Date</span>
              <span>Actions</span>
            </div>

            {videos.map((video, idx) => (
              <div key={video.id}>
                <div
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 140px 180px 100px 120px",
                    padding: "12px 16px", alignItems: "center",
                    borderBottom: idx < videos.length - 1 ? "1px solid var(--card-border)" : "none",
                    background: "var(--card-bg)",
                  }}
                >
                  <a
                    href={`/video/${video.id}`}
                    style={{
                      fontSize: 13, color: "var(--foreground)", textDecoration: "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                  >
                    {video.title}
                  </a>
                  <span style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {video.department}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {video.created_by}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{fmt(video.created_at)}</span>

                  <div style={{ display: "flex", gap: 5 }}>
                    {confirmDelete === video.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(video.id)}
                          disabled={deleteLoading}
                          style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 5,
                            border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
                            cursor: deleteLoading ? "not-allowed" : "pointer",
                            opacity: deleteLoading ? 0.6 : 1,
                          }}
                        >
                          {deleteLoading ? "…" : "Yes"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(video.id)}
                        style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
