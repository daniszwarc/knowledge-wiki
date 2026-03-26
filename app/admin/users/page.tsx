"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  totp_enabled: boolean;
  last_login: string | null;
  created_at: string;
}

const ROLES = ["viewer", "validator", "editor", "admin"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("viewer");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([userList, me]) => {
      setUsers(userList);
      setSelfId(me.id);
      setLoading(false);
    });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Failed"); return; }
      const updated = await fetch("/api/admin/users").then((r) => r.json());
      setUsers(updated);
      setShowAdd(false);
      setNewEmail(""); setNewPassword(""); setNewRole("viewer");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
  }

  async function handleReset2FA(userId: string) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset2fa: true }),
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, totp_enabled: false } : u));
  }

  async function handleDelete(userId: string) {
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setConfirmDelete(null);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  function fmt(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--sidebar-border)", padding: "16px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>← Home</a>
        <span style={{ color: "var(--muted-light)", opacity: 0.4 }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>User management</span>
        <button
          onClick={() => setShowAdd((p) => !p)}
          style={{
            marginLeft: "auto", fontSize: 12, padding: "5px 14px", borderRadius: 7,
            border: "1px solid var(--card-border)", background: "var(--foreground)", color: "var(--background)",
            cursor: "pointer", fontWeight: 500,
          }}
        >
          {showAdd ? "Cancel" : "+ Add user"}
        </button>
      </div>

      <div style={{ maxWidth: 860, width: "100%", padding: "32px 32px 64px" }}>

        {/* Add user form */}
        {showAdd && (
          <form onSubmit={handleAdd} style={{
            marginBottom: 28, padding: 20, border: "1px solid var(--card-border)",
            borderRadius: 10, background: "var(--card-bg)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 180px" }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>Email</label>
              <input className="search-input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required style={{ padding: "7px 10px", fontSize: 13, borderRadius: 6 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 140px" }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>Password</label>
              <input className="search-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ padding: "7px 10px", fontSize: 13, borderRadius: 6 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="search-input" style={{ padding: "7px 10px", fontSize: 13, borderRadius: 6 }}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={addLoading} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, borderRadius: 7, border: "none", background: "var(--foreground)", color: "var(--background)", cursor: "pointer" }}>
              {addLoading ? "Adding…" : "Add"}
            </button>
            {addError && <p style={{ width: "100%", fontSize: 12, color: "#b91c1c", margin: 0 }}>{addError}</p>}
          </form>
        )}

        {loading ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p>
        ) : (
          <div style={{ border: "1px solid var(--card-border)", borderRadius: 10, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 100px 80px 120px 120px",
              padding: "10px 16px", background: "var(--sidebar-bg)",
              borderBottom: "1px solid var(--card-border)",
              fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              <span>Email</span><span>Role</span><span>2FA</span><span>Last login</span><span>Actions</span>
            </div>

            {users.map((user, idx) => (
              <div
                key={user.id}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 100px 80px 120px 120px",
                  padding: "12px 16px", alignItems: "center",
                  borderBottom: idx < users.length - 1 ? "1px solid var(--card-border)" : "none",
                  background: "var(--card-bg)",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                  {user.id === selfId && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--muted-light)" }}>(you)</span>}
                </span>

                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={user.id === selfId}
                  className="search-input"
                  style={{ fontSize: 12, padding: "3px 6px", borderRadius: 5 }}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>

                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 99, display: "inline-block",
                  background: user.totp_enabled ? "#dcfce7" : "#fef3c7",
                  color: user.totp_enabled ? "#15803d" : "#92400e",
                  border: `1px solid ${user.totp_enabled ? "#bbf7d0" : "#fde68a"}`,
                }}>
                  {user.totp_enabled ? "On" : "Off"}
                </span>

                <span style={{ fontSize: 12, color: "var(--muted)" }}>{fmt(user.last_login)}</span>

                <div style={{ display: "flex", gap: 5 }}>
                  {user.totp_enabled && (
                    <button
                      onClick={() => handleReset2FA(user.id)}
                      style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                    >
                      Reset 2FA
                    </button>
                  )}
                  {user.id !== selfId && (
                    confirmDelete === user.id ? (
                      <>
                        <button onClick={() => handleDelete(user.id)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}>Yes</button>
                        <button onClick={() => setConfirmDelete(null)} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 5, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}>✕</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDelete(user.id)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}>Delete</button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
