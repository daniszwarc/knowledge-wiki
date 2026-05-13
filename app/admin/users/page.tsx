"use client";

import { useEffect, useRef, useState } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  totp_enabled: boolean;
  two_fa_method: string;
  last_login: string | null;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  company_number: number | null;
}

const ROLES = ["viewer", "validator", "editor", "admin", "developer", "super_admin", "company_admin"];
const RESTRICTED_ROLES = ["admin", "super_admin", "developer"];

function CompanyMultiSelect({
  companies,
  selected,
  onChange,
}: {
  companies: Company[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectedCompanies = companies.filter((c) => selected.includes(c.id));
  const unselectedFiltered = companies
    .filter((c) => !selected.includes(c.id))
    .filter((c) => {
      const q = query.toLowerCase();
      return c.name.toLowerCase().includes(q) || String(c.company_number ?? "").includes(q);
    });

  function remove(id: string) {
    onChange(selected.filter((s) => s !== id));
  }

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  function selectAll() {
    onChange([...selected, ...unselectedFiltered.map((c) => c.id)]);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {selectedCompanies.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
          {selectedCompanies.map((c) => (
            <span
              key={c.id}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 7px 2px 8px",
                background: "var(--sidebar-bg)",
                border: "0.5px solid var(--card-border)",
                borderRadius: 99,
                fontSize: 12,
                color: "var(--foreground)",
              }}
            >
              {c.company_number != null ? `${c.company_number} - ${c.name}` : c.name}
              <button
                type="button"
                onClick={() => remove(c.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0 0 0 2px", fontSize: 14, lineHeight: 1,
                  color: "var(--muted)", display: "flex", alignItems: "center",
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        className="search-input"
        type="text"
        value={query}
        placeholder="Search and select companies..."
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        style={{ width: "100%", padding: "7px 10px", fontSize: 13, borderRadius: 6, boxSizing: "border-box" }}
      />

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          marginTop: 4, minWidth: "400px",
          background: "var(--background)", border: "0.5px solid var(--card-border)",
          borderRadius: "var(--border-radius-md)", zIndex: 1000,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        }}>
          <div style={{
            display: "flex", gap: 12, padding: "6px 12px",
            borderBottom: "1px solid var(--card-border)",
          }}>
            <button
              type="button"
              onClick={selectAll}
              style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Clear all
            </button>
          </div>

          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {unselectedFiltered.length === 0 ? (
              <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>
                {query ? "No matches" : "All companies selected"}
              </div>
            ) : (
              unselectedFiltered.map((c) => (
                <label
                  key={c.id}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 12px", fontSize: 13, color: "var(--foreground)",
                    cursor: "pointer", background: "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggle(c.id)}
                    style={{ accentColor: "var(--foreground)", flexShrink: 0 }}
                  />
                  {c.company_number != null ? `${c.company_number} - ${c.name}` : c.name}
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [selfRole, setSelfRole] = useState<string>("");
  const [selfCompanyIds, setSelfCompanyIds] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("viewer");
  const [newCompanies, setNewCompanies] = useState<string[]>([]);
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [editCompaniesUserId, setEditCompaniesUserId] = useState<string | null>(null);
  const [editCompaniesSelected, setEditCompaniesSelected] = useState<string[]>([]);
  const [editCompaniesSaving, setEditCompaniesSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/companies").then((r) => r.ok ? r.json() : []),
    ]).then(([userList, me, allCompanies]) => {
      setUsers(userList);
      setSelfId(me.id);
      setSelfRole(me.role ?? "");
      setSelfCompanyIds((me.companies ?? []).map((c: Company) => c.id));
      const sorted = (allCompanies as Company[])
        .filter((c) => c.id !== "all" && c.company_number != null)
        .sort((a, b) => (a.company_number ?? 0) - (b.company_number ?? 0));
      setCompanies(sorted);
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
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole, companies: newCompanies }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Failed"); return; }
      const updated = await fetch("/api/admin/users").then((r) => r.json());
      setUsers(updated);
      setShowAdd(false);
      setNewEmail(""); setNewPassword(""); setNewRole("viewer"); setNewCompanies([]);
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

  async function openCompanyEditor(userId: string) {
    if (editCompaniesUserId === userId) {
      setEditCompaniesUserId(null);
      return;
    }
    const assigned = await fetch(`/api/admin/users/${userId}/companies`).then((r) => r.ok ? r.json() : []);
    setEditCompaniesSelected(assigned);
    setEditCompaniesUserId(userId);
  }

  async function saveCompanies() {
    if (!editCompaniesUserId) return;
    setEditCompaniesSaving(true);
    await fetch(`/api/admin/users/${editCompaniesUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companies: editCompaniesSelected }),
    });
    setEditCompaniesSaving(false);
    setEditCompaniesUserId(null);
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
            borderRadius: 10, background: "var(--card-bg)",
          }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: companies.length > 0 ? 16 : 0 }}>
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
                  {ROLES.filter((r) => selfRole === "company_admin" ? !RESTRICTED_ROLES.includes(r) : true).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" disabled={addLoading} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, borderRadius: 7, border: "none", background: "var(--foreground)", color: "var(--background)", cursor: "pointer" }}>
                {addLoading ? "Adding…" : "Add"}
              </button>
            </div>

            {companies.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Company access
                </div>
                <CompanyMultiSelect
                  companies={selfRole === "company_admin" ? companies.filter((c) => selfCompanyIds.includes(c.id)) : companies}
                  selected={newCompanies}
                  onChange={setNewCompanies}
                />
              </div>
            )}

            {addError && <p style={{ width: "100%", fontSize: 12, color: "#b91c1c", margin: "8px 0 0" }}>{addError}</p>}
          </form>
        )}

        {loading ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p>
        ) : (
          <div style={{ border: "1px solid var(--card-border)", borderRadius: 10, overflow: "visible" }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 100px 80px 120px 160px",
              padding: "10px 16px", background: "var(--sidebar-bg)",
              borderBottom: "1px solid var(--card-border)",
              fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              <span>Email</span><span>Role</span><span>2FA</span><span>Last login</span><span>Actions</span>
            </div>

            {users.map((user, idx) => (
              <div key={user.id}>
                <div
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 100px 80px 120px 160px",
                    padding: "12px 16px", alignItems: "center",
                    borderBottom: idx < users.length - 1 || editCompaniesUserId === user.id ? "1px solid var(--card-border)" : "none",
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
                    background: (user.totp_enabled || user.two_fa_method === 'email') ? "#dcfce7" : "#fef3c7",
                    color: (user.totp_enabled || user.two_fa_method === 'email') ? "#15803d" : "#92400e",
                    border: `1px solid ${(user.totp_enabled || user.two_fa_method === 'email') ? "#bbf7d0" : "#fde68a"}`,
                  }}>
                    {user.totp_enabled ? "TOTP" : user.two_fa_method === 'email' ? "Email" : "Off"}
                  </span>

                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{fmt(user.last_login)}</span>

                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <button
                      onClick={() => openCompanyEditor(user.id)}
                      style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 5,
                        border: `1px solid ${editCompaniesUserId === user.id ? "var(--foreground)" : "var(--card-border)"}`,
                        background: editCompaniesUserId === user.id ? "var(--foreground)" : "none",
                        color: editCompaniesUserId === user.id ? "var(--background)" : "var(--muted)",
                        cursor: "pointer",
                      }}
                    >
                      Companies
                    </button>
                    {(user.totp_enabled || user.two_fa_method === 'email') && (
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

                {/* Company editor panel */}
                {editCompaniesUserId === user.id && (
                  <div style={{
                    padding: "16px 20px", background: "var(--sidebar-bg)",
                    borderBottom: idx < users.length - 1 ? "1px solid var(--card-border)" : "none",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                      Company access for {user.email}
                    </div>
                    {companies.length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--muted-light)", margin: "0 0 12px" }}>No companies configured.</p>
                    ) : (
                      <div style={{ marginBottom: 14 }}>
                        <CompanyMultiSelect
                          companies={selfRole === "company_admin" ? companies.filter((c) => selfCompanyIds.includes(c.id)) : companies}
                          selected={editCompaniesSelected}
                          onChange={setEditCompaniesSelected}
                        />
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={saveCompanies}
                        disabled={editCompaniesSaving}
                        style={{ fontSize: 12, padding: "5px 14px", borderRadius: 6, border: "none", background: "var(--foreground)", color: "var(--background)", cursor: "pointer", fontWeight: 500 }}
                      >
                        {editCompaniesSaving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditCompaniesUserId(null)}
                        style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
