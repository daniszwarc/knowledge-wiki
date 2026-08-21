"use client";

import { useEffect, useState } from "react";

interface Platform {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface Category {
  id: string;
  platform_id: string;
  name: string;
  description: string | null;
  accepted_files: string[];
  form_fields: Record<string, boolean>;
  processing_type: string;
  created_at: string;
}

const FILE_OPTIONS = ["pdf", "docx", "txt", "vtt"];
const FORM_FIELD_OPTIONS: { key: string; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "department", label: "Department" },
  { key: "company", label: "Company" },
  { key: "embed_url", label: "Embed URL" },
  { key: "auto_extract", label: "Auto-extract" },
];
const PROCESSING_TYPES = ["rules", "article", "sed", "video"];

function emptyCategoryForm() {
  return {
    name: "",
    description: "",
    accepted_files: [] as string[],
    form_fields: {} as Record<string, boolean>,
    processing_type: "rules",
  };
}

function CategoryForm({
  value,
  onChange,
}: {
  value: ReturnType<typeof emptyCategoryForm>;
  onChange: (v: ReturnType<typeof emptyCategoryForm>) => void;
}) {
  function toggleFile(f: string) {
    onChange({
      ...value,
      accepted_files: value.accepted_files.includes(f)
        ? value.accepted_files.filter((x) => x !== f)
        : [...value.accepted_files, f],
    });
  }

  function toggleField(key: string) {
    onChange({ ...value, form_fields: { ...value.form_fields, [key]: !value.form_fields[key] } });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 200px" }}>
          <label style={{ fontSize: 11, color: "var(--muted)" }}>Name</label>
          <input
            className="search-input"
            type="text"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            style={{ padding: "7px 10px", fontSize: 13, borderRadius: 6 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, color: "var(--muted)" }}>Processing type</label>
          <select
            className="search-input"
            value={value.processing_type}
            onChange={(e) => onChange({ ...value, processing_type: e.target.value })}
            style={{ padding: "7px 10px", fontSize: 13, borderRadius: 6 }}
          >
            {PROCESSING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label style={{ fontSize: 11, color: "var(--muted)" }}>Description</label>
        <input
          className="search-input"
          type="text"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          style={{ padding: "7px 10px", fontSize: 13, borderRadius: 6 }}
        />
      </div>

      <div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Accepted file types</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {FILE_OPTIONS.map((f) => (
            <label key={f} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--foreground)", cursor: "pointer" }}>
              <input type="checkbox" checked={value.accepted_files.includes(f)} onChange={() => toggleFile(f)} style={{ accentColor: "var(--foreground)" }} />
              {f}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Form fields</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {FORM_FIELD_OPTIONS.map((f) => (
            <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--foreground)", cursor: "pointer" }}>
              <input type="checkbox" checked={!!value.form_fields[f.key]} onChange={() => toggleField(f.key)} style={{ accentColor: "var(--foreground)" }} />
              {f.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [categories, setCategories] = useState<Record<string, Category[]>>({});
  const [loading, setLoading] = useState(true);

  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformSlug, setNewPlatformSlug] = useState("");
  const [addPlatformError, setAddPlatformError] = useState("");
  const [addPlatformLoading, setAddPlatformLoading] = useState(false);

  const [editPlatformId, setEditPlatformId] = useState<string | null>(null);
  const [editPlatformName, setEditPlatformName] = useState("");
  const [editPlatformSlug, setEditPlatformSlug] = useState("");

  const [confirmDeletePlatform, setConfirmDeletePlatform] = useState<string | null>(null);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const [showAddCategoryFor, setShowAddCategoryFor] = useState<string | null>(null);
  const [addCategoryForm, setAddCategoryForm] = useState(emptyCategoryForm());
  const [addCategoryError, setAddCategoryError] = useState("");
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);

  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryForm, setEditCategoryForm] = useState(emptyCategoryForm());
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/platforms")
      .then((r) => r.json())
      .then((data) => { setPlatforms(data); setLoading(false); });
  }, []);

  async function loadCategories(platformId: string) {
    const rows = await fetch(`/api/admin/categories?platform_id=${platformId}`).then((r) => r.ok ? r.json() : []);
    setCategories((prev) => ({ ...prev, [platformId]: rows }));
  }

  async function toggleExpand(platformId: string) {
    if (expandedPlatform === platformId) {
      setExpandedPlatform(null);
      return;
    }
    setExpandedPlatform(platformId);
    if (!categories[platformId]) await loadCategories(platformId);
  }

  async function handleAddPlatform(e: React.FormEvent) {
    e.preventDefault();
    setAddPlatformError("");
    setAddPlatformLoading(true);
    try {
      const res = await fetch("/api/admin/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlatformName, slug: newPlatformSlug }),
      });
      const data = await res.json();
      if (!res.ok) { setAddPlatformError(data.error ?? "Failed"); return; }
      setPlatforms((prev) => [...prev, data]);
      setShowAddPlatform(false);
      setNewPlatformName(""); setNewPlatformSlug("");
    } finally {
      setAddPlatformLoading(false);
    }
  }

  function startEditPlatform(p: Platform) {
    setEditPlatformId(p.id);
    setEditPlatformName(p.name);
    setEditPlatformSlug(p.slug);
  }

  async function saveEditPlatform() {
    if (!editPlatformId) return;
    const res = await fetch(`/api/admin/platforms/${editPlatformId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editPlatformName, slug: editPlatformSlug }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setPlatforms((prev) => prev.map((p) => p.id === data.id ? data : p));
    setEditPlatformId(null);
  }

  async function handleDeletePlatform(id: string) {
    await fetch(`/api/admin/platforms/${id}`, { method: "DELETE" });
    setConfirmDeletePlatform(null);
    setPlatforms((prev) => prev.filter((p) => p.id !== id));
    if (expandedPlatform === id) setExpandedPlatform(null);
  }

  async function handleAddCategory(e: React.FormEvent, platformId: string) {
    e.preventDefault();
    setAddCategoryError("");
    if (!addCategoryForm.name.trim()) { setAddCategoryError("Name is required"); return; }
    if (addCategoryForm.accepted_files.length === 0) { setAddCategoryError("Select at least one file type"); return; }
    setAddCategoryLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform_id: platformId, ...addCategoryForm }),
      });
      const data = await res.json();
      if (!res.ok) { setAddCategoryError(data.error ?? "Failed"); return; }
      setCategories((prev) => ({ ...prev, [platformId]: [...(prev[platformId] ?? []), data] }));
      setShowAddCategoryFor(null);
      setAddCategoryForm(emptyCategoryForm());
    } finally {
      setAddCategoryLoading(false);
    }
  }

  function startEditCategory(c: Category) {
    setEditCategoryId(c.id);
    setEditCategoryForm({
      name: c.name,
      description: c.description ?? "",
      accepted_files: c.accepted_files,
      form_fields: c.form_fields,
      processing_type: c.processing_type,
    });
  }

  async function saveEditCategory(platformId: string) {
    if (!editCategoryId) return;
    const res = await fetch(`/api/admin/categories/${editCategoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editCategoryForm),
    });
    if (!res.ok) return;
    const data = await res.json();
    setCategories((prev) => ({
      ...prev,
      [platformId]: (prev[platformId] ?? []).map((c) => c.id === data.id ? data : c),
    }));
    setEditCategoryId(null);
  }

  async function handleDeleteCategory(platformId: string, id: string) {
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    setConfirmDeleteCategory(null);
    setCategories((prev) => ({
      ...prev,
      [platformId]: (prev[platformId] ?? []).filter((c) => c.id !== id),
    }));
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--sidebar-border)", padding: "16px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>← Home</a>
        <span style={{ color: "var(--muted-light)", opacity: 0.4 }}>·</span>
        <a href="/admin/users" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>User management</a>
        <span style={{ color: "var(--muted-light)", opacity: 0.4 }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Platforms</span>
        <button
          onClick={() => setShowAddPlatform((p) => !p)}
          style={{
            marginLeft: "auto", fontSize: 12, padding: "5px 14px", borderRadius: 7,
            border: "1px solid var(--card-border)", background: "var(--foreground)", color: "var(--background)",
            cursor: "pointer", fontWeight: 500,
          }}
        >
          {showAddPlatform ? "Cancel" : "+ Add platform"}
        </button>
      </div>

      <div style={{ maxWidth: 900, width: "100%", padding: "32px 32px 64px" }}>

        {/* Add platform form */}
        {showAddPlatform && (
          <form onSubmit={handleAddPlatform} style={{
            marginBottom: 28, padding: 20, border: "1px solid var(--card-border)",
            borderRadius: 10, background: "var(--card-bg)",
            display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 200px" }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>Name</label>
              <input className="search-input" type="text" value={newPlatformName} onChange={(e) => setNewPlatformName(e.target.value)} required style={{ padding: "7px 10px", fontSize: 13, borderRadius: 6 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 160px" }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>Slug</label>
              <input className="search-input" type="text" value={newPlatformSlug} onChange={(e) => setNewPlatformSlug(e.target.value)} required style={{ padding: "7px 10px", fontSize: 13, borderRadius: 6 }} />
            </div>
            <button type="submit" disabled={addPlatformLoading} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, borderRadius: 7, border: "none", background: "var(--foreground)", color: "var(--background)", cursor: "pointer" }}>
              {addPlatformLoading ? "Adding…" : "Add"}
            </button>
            {addPlatformError && <p style={{ width: "100%", fontSize: 12, color: "#b91c1c", margin: 0 }}>{addPlatformError}</p>}
          </form>
        )}

        {loading ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p>
        ) : platforms.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No platforms yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {platforms.map((p) => (
              <div key={p.id} style={{ border: "1px solid var(--card-border)", borderRadius: 10, background: "var(--card-bg)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                  {editPlatformId === p.id ? (
                    <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
                      <input className="search-input" value={editPlatformName} onChange={(e) => setEditPlatformName(e.target.value)} style={{ padding: "5px 8px", fontSize: 13, borderRadius: 6, flex: "1 1 160px" }} />
                      <input className="search-input" value={editPlatformSlug} onChange={(e) => setEditPlatformSlug(e.target.value)} style={{ padding: "5px 8px", fontSize: 13, borderRadius: 6, flex: "1 1 120px" }} />
                      <button onClick={saveEditPlatform} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: "var(--foreground)", color: "var(--background)", cursor: "pointer" }}>Save</button>
                      <button onClick={() => setEditPlatformId(null)} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>/{p.slug}</div>
                      </div>
                      <button onClick={() => toggleExpand(p.id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: `1px solid ${expandedPlatform === p.id ? "var(--foreground)" : "var(--card-border)"}`, background: expandedPlatform === p.id ? "var(--foreground)" : "none", color: expandedPlatform === p.id ? "var(--background)" : "var(--muted)", cursor: "pointer" }}>
                        Categories ({categories[p.id]?.length ?? "…"})
                      </button>
                      <button onClick={() => startEditPlatform(p)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}>Edit</button>
                      {confirmDeletePlatform === p.id ? (
                        <>
                          <button onClick={() => handleDeletePlatform(p.id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}>Yes</button>
                          <button onClick={() => setConfirmDeletePlatform(null)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 5, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}>✕</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDeletePlatform(p.id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}>Delete</button>
                      )}
                    </>
                  )}
                </div>

                {expandedPlatform === p.id && (
                  <div style={{ borderTop: "1px solid var(--card-border)", padding: "16px 20px", background: "var(--sidebar-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Categories
                      </div>
                      <button
                        onClick={() => { setShowAddCategoryFor(showAddCategoryFor === p.id ? null : p.id); setAddCategoryForm(emptyCategoryForm()); setAddCategoryError(""); }}
                        style={{ marginLeft: "auto", fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "1px solid var(--card-border)", background: "none", color: "var(--foreground)", cursor: "pointer" }}
                      >
                        {showAddCategoryFor === p.id ? "Cancel" : "+ Add category"}
                      </button>
                    </div>

                    {showAddCategoryFor === p.id && (
                      <form onSubmit={(e) => handleAddCategory(e, p.id)} style={{ marginBottom: 16, padding: 14, border: "1px solid var(--card-border)", borderRadius: 8, background: "var(--card-bg)" }}>
                        <CategoryForm value={addCategoryForm} onChange={setAddCategoryForm} />
                        {addCategoryError && <p style={{ fontSize: 12, color: "#b91c1c", margin: "10px 0 0" }}>{addCategoryError}</p>}
                        <button type="submit" disabled={addCategoryLoading} style={{ marginTop: 12, padding: "6px 14px", fontSize: 12, fontWeight: 500, borderRadius: 6, border: "none", background: "var(--foreground)", color: "var(--background)", cursor: "pointer" }}>
                          {addCategoryLoading ? "Adding…" : "Add category"}
                        </button>
                      </form>
                    )}

                    {(categories[p.id] ?? []).length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--muted-light)", margin: 0 }}>No categories yet.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(categories[p.id] ?? []).map((c) => (
                          <div key={c.id} style={{ border: "1px solid var(--card-border)", borderRadius: 8, background: "var(--card-bg)", padding: "10px 14px" }}>
                            {editCategoryId === c.id ? (
                              <div>
                                <CategoryForm value={editCategoryForm} onChange={setEditCategoryForm} />
                                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                  <button onClick={() => saveEditCategory(p.id)} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 6, border: "none", background: "var(--foreground)", color: "var(--background)", cursor: "pointer" }}>Save</button>
                                  <button onClick={() => setEditCategoryId(null)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>{c.name}</div>
                                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                                    {c.processing_type} · {c.accepted_files.join(", ")}
                                  </div>
                                </div>
                                <button onClick={() => startEditCategory(c)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}>Edit</button>
                                {confirmDeleteCategory === c.id ? (
                                  <>
                                    <button onClick={() => handleDeleteCategory(p.id, c.id)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}>Yes</button>
                                    <button onClick={() => setConfirmDeleteCategory(null)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}>✕</button>
                                  </>
                                ) : (
                                  <button onClick={() => setConfirmDeleteCategory(c.id)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}>Delete</button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
