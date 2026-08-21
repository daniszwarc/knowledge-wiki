"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

interface Me {
  id: string;
  email: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
}

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  platform_id: string;
  name: string;
  description: string | null;
  accepted_files: string[];
  processing_type: "rules" | "article" | "sed" | "video" | string;
}

type DocType = "rules" | "article" | "sed" | "video";

type SFileStatus = "pending" | "processing" | "success" | "error";

interface SFileItem {
  id: string;
  file: File;
  status: SFileStatus;
  error?: string;
  sedId?: string;
  ticketNumber?: string;
  projectTitle?: string;
}

type UploadResult =
  | { type: "process"; workflowId: string | null; workflowName: string; rulesExtracted: number; articleId: string | null }
  | { type: "article"; articleId: string | null; title: string }
  | { type: "sed"; sedId: string; ticketNumber: string; projectTitle: string }
  | { type: "video"; videoId: string; title: string };

const STAGES: [number, number, string][] = [
  [500, 8, "Uploading file…"],
  [2000, 18, "Processing document…"],
  [8000, 32, "Extracting content…"],
  [25000, 48, "Still working…"],
  [55000, 62, "This can take a minute…"],
  [100000, 74, "Almost there…"],
  [160000, 84, "Finalising…"],
  [220000, 92, "Just a moment…"],
];

const PROCESSING_TYPE_FALLBACK_DESCRIPTION: Record<string, string> = {
  rules: "Extracts business rules into a workflow",
  article: "How-to guide, training material, or both",
  sed: "Small enhancement document",
  video: "SharePoint video with VTT transcript",
};

export default function UploadPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [categoriesByPlatform, setCategoriesByPlatform] = useState<Record<string, Category[]>>({});
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const allCategories = platforms.flatMap((p) => categoriesByPlatform[p.id] ?? []);
  const selectedCategory = allCategories.find((c) => c.id === selectedCategoryId) ?? null;
  const selectedType = (selectedCategory?.processing_type as DocType) ?? null;
  const acceptAttr = selectedCategory ? selectedCategory.accepted_files.map((f) => `.${f}`).join(",") : "";
  const acceptLabel = selectedCategory ? selectedCategory.accepted_files.map((f) => f.toUpperCase()).join(" · ") : "";

  // Process form
  const [pFile, setPFile] = useState<File | null>(null);
  const [pWorkflow, setPWorkflow] = useState("");
  const [pDept, setPDept] = useState("");
  const [pCompany, setPCompany] = useState("all");
  const pFileRef = useRef<HTMLInputElement>(null);
  const [pDragging, setPDragging] = useState(false);

  // Article form
  const [aFile, setAFile] = useState<File | null>(null);
  const [aTitle, setATitle] = useState("");
  const [aDept, setADept] = useState("");
  const [aWorkflow, setAWorkflow] = useState("");
  const [aAppearsAs, setAAppearsAs] = useState<Set<string>>(new Set(["how_to_guide"]));
  const [aCompany, setACompany] = useState("all");
  const aFileRef = useRef<HTMLInputElement>(null);
  const [aDragging, setADragging] = useState(false);

  // SED form
  const [sFiles, setSFiles] = useState<SFileItem[]>([]);
  const [sCompany, setSCompany] = useState("all");
  const sFileRef = useRef<HTMLInputElement>(null);
  const [sDragging, setSDragging] = useState(false);
  const [sSummary, setSSummary] = useState<{ succeeded: number; failed: number } | null>(null);

  // Video form
  const [vFile, setVFile] = useState<File | null>(null);
  const [vTitle, setVTitle] = useState("");
  const [vDept, setVDept] = useState("");
  const [vEmbedUrl, setVEmbedUrl] = useState("");
  const [vCompany, setVCompany] = useState("all");
  const vFileRef = useRef<HTMLInputElement>(null);
  const [vDragging, setVDragging] = useState(false);

  // Shared state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

    fetch("/api/platforms/user")
      .then((r) => (r.ok ? r.json() : []))
      .then(async (platformList: Platform[]) => {
        setPlatforms(platformList);
        const entries = await Promise.all(
          platformList.map(async (p) => {
            const cats = await fetch(`/api/categories?platform_id=${p.id}`).then((r) => (r.ok ? r.json() : []));
            return [p.id, cats] as const;
          })
        );
        const map: Record<string, Category[]> = {};
        for (const [id, cats] of entries) map[id] = cats;
        setCategoriesByPlatform(map);
        const firstCategory = platformList.flatMap((p) => map[p.id] ?? [])[0];
        if (firstCategory) setSelectedCategoryId(firstCategory.id);
        setCategoriesLoading(false);
      });
  }, []);

  if (authLoading) return null;

  function startProgress() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = STAGES.map(([delay, pct, lbl]) =>
      setTimeout(() => { setProgress(pct); setStage(lbl); }, delay)
    );
  }

  function stopProgress(success: boolean) {
    timersRef.current.forEach(clearTimeout);
    setProgress(success ? 100 : 0);
    setStage(success ? "Done" : "");
  }

  function toggleAppearsAs(tag: string) {
    setAAppearsAs((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        if (next.size > 1) next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function appendCompanyFields(fd: FormData, companyId: string) {
    if (companyId === "all") {
      fd.append("is_corporate", "true");
    } else {
      fd.append("is_corporate", "false");
      fd.append("company_id", companyId);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setResult(null);
    setError("");
    setProgress(0);
    setStage("");
    startProgress();

    try {
      const fd = new FormData();

      if (selectedType === "rules") {
        if (!pFile || !pWorkflow.trim() || !pDept.trim()) return;
        fd.append("file", pFile);
        fd.append("workflow_name", pWorkflow.trim());
        fd.append("department", pDept.trim());
        appendCompanyFields(fd, pCompany);
        const res = await fetch("/api/upload/process", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
        const json = await res.json();
        stopProgress(true);
        localStorage.setItem("lastDepartment", pDept.trim());
        localStorage.setItem("lastWorkflow", pWorkflow.trim());
        setResult({ type: "process", workflowId: json.workflow_id, workflowName: json.workflow_name, rulesExtracted: json.rules_extracted, articleId: json.article_id ?? null });
        window.dispatchEvent(new Event("wiki:content-updated"));
        router.refresh();

      } else if (selectedType === "article") {
        if (!aFile || !aTitle.trim() || !aDept.trim() || aAppearsAs.size === 0) return;
        fd.append("file", aFile);
        fd.append("title", aTitle.trim());
        fd.append("department", aDept.trim());
        if (aWorkflow.trim()) fd.append("workflow_name", aWorkflow.trim());
        fd.append("appears_as", Array.from(aAppearsAs).join(","));
        appendCompanyFields(fd, aCompany);
        const res = await fetch("/api/upload/article", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
        const json = await res.json();
        stopProgress(true);
        localStorage.setItem("lastDepartment", aDept.trim());
        setResult({ type: "article", articleId: json.article_id, title: json.title });
        window.dispatchEvent(new Event("wiki:content-updated"));
        router.refresh();

      } else if (selectedType === "sed") {
        if (sFiles.length === 0) return;
        setSSummary(null);

        let succeeded = 0;
        let failed = 0;

        for (const item of sFiles) {
          setSFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: "processing", error: undefined } : f)));
          try {
            const sfd = new FormData();
            sfd.append("file", item.file);
            appendCompanyFields(sfd, sCompany);
            const res = await fetch("/api/upload/sed", { method: "POST", body: sfd });
            if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
            const json = await res.json();
            succeeded++;
            setSFiles((prev) => prev.map((f) => (f.id === item.id
              ? { ...f, status: "success", sedId: json.sed_id, ticketNumber: json.ticket_number, projectTitle: json.project_title }
              : f)));
          } catch (err) {
            failed++;
            const message = err instanceof Error ? err.message : "Upload failed";
            setSFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: "error", error: message } : f)));
          }
        }

        stopProgress(true);
        setSSummary({ succeeded, failed });
        window.dispatchEvent(new Event("wiki:content-updated"));
        router.refresh();

      } else {
        if (!vFile || !vTitle.trim() || !vDept.trim() || !vEmbedUrl.trim()) return;
        fd.append("srt_file", vFile);
        fd.append("title", vTitle.trim());
        fd.append("department", vDept.trim());
        fd.append("embed_url", vEmbedUrl.trim());
        appendCompanyFields(fd, vCompany);
        const res = await fetch("/api/upload/video", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
        const json = await res.json();
        stopProgress(true);
        localStorage.setItem("lastDepartment", vDept.trim());
        setResult({ type: "video", videoId: json.video_id, title: json.title });
        window.dispatchEvent(new Event("wiki:content-updated"));
        router.refresh();
      }
    } catch (err) {
      stopProgress(false);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function isDisabled(): boolean {
    if (loading) return true;
    if (!selectedCategory) return true;
    if (selectedType === "rules") return !pFile || !pWorkflow.trim() || !pDept.trim();
    if (selectedType === "article") return !aFile || !aTitle.trim() || !aDept.trim() || aAppearsAs.size === 0;
    if (selectedType === "video") return !vFile || !vTitle.trim() || !vDept.trim() || !vEmbedUrl.trim();
    return sFiles.length === 0;
  }

  const dropzoneBase: React.CSSProperties = {
    borderRadius: 8,
    padding: "28px 16px",
    textAlign: "center",
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
    marginBottom: 14,
  };

  const SED_STATUS_COLORS: Record<SFileStatus, { bg: string; fg: string }> = {
    pending: { bg: "var(--sidebar-bg)", fg: "var(--muted)" },
    processing: { bg: "#fef9c3", fg: "#854d0e" },
    success: { bg: "#dcfce7", fg: "#15803d" },
    error: { bg: "#fee2e2", fg: "#b91c1c" },
  };

  const companySelectStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 14px",
    fontSize: 13,
    borderRadius: 8,
    marginBottom: 14,
    boxSizing: "border-box",
  };

  function CompanyDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 6 }}>Company</div>
        <select
          className="search-input"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={companySelectStyle}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      <Sidebar me={me} />

      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "32px 40px 64px", maxWidth: 760, width: "100%" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--foreground)", marginBottom: 6, lineHeight: 1.3 }}>
              Add document
            </h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
              Select what you are adding. The form adapts to the document type.
            </p>
          </div>

          {/* Type selector */}
          {categoriesLoading ? (
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Loading document types…</p>
          ) : allCategories.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
              No document categories available. Contact an admin to get platform access.
            </p>
          ) : (
            platforms.map((p) => {
              const cats = categoriesByPlatform[p.id] ?? [];
              if (cats.length === 0) return null;
              return (
                <div key={p.id} style={{ marginBottom: 20 }}>
                  {platforms.length > 1 && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                      {p.name}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    {cats.map((c) => {
                      const selected = selectedCategoryId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setSelectedCategoryId(c.id); setResult(null); setError(""); }}
                          style={{
                            border: selected ? "2px solid var(--foreground)" : "0.5px solid var(--card-border)",
                            borderRadius: 12,
                            padding: "16px 18px",
                            textAlign: "left",
                            cursor: "pointer",
                            background: selected ? "var(--card-hover-bg)" : "var(--sidebar-bg)",
                            transition: "border-color 0.1s, background 0.1s",
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: selected ? 700 : 500, color: "var(--foreground)", marginBottom: 4 }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
                            {c.description || PROCESSING_TYPE_FALLBACK_DESCRIPTION[c.processing_type] || ""}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Form card */}
          <div style={{ border: "0.5px solid var(--card-border)", borderRadius: 12, padding: "24px 28px" }}>
            <form onSubmit={handleSubmit}>

              {/* ── Process document ── */}
              {selectedType === "rules" && (
                <>
                  <div
                    onClick={() => pFileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setPDragging(true); }}
                    onDragLeave={() => setPDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setPDragging(false); const f = e.dataTransfer.files[0]; if (f) setPFile(f); }}
                    style={{ ...dropzoneBase, border: `1.5px dashed ${pDragging ? "var(--foreground)" : "var(--card-border)"}`, background: pDragging ? "var(--card-hover-bg)" : "var(--sidebar-bg)" }}
                  >
                    <input ref={pFileRef} type="file" accept={acceptAttr} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setPFile(f); }} />
                    <span style={{ fontSize: 13, color: pFile ? "var(--foreground)" : "var(--muted-light)" }}>
                      {pFile ? pFile.name : `Drop a ${acceptLabel} file here, or click to browse`}
                    </span>
                    {!pFile && <div style={{ fontSize: 11, color: "var(--muted-light)", marginTop: 4 }}>{acceptLabel}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <input
                      className="search-input"
                      required
                      value={pWorkflow}
                      onChange={(e) => setPWorkflow(e.target.value)}
                      placeholder="Workflow / topic name"
                      style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                    />
                    <input
                      className="search-input"
                      list="dept-options"
                      required
                      value={pDept}
                      onChange={(e) => setPDept(e.target.value)}
                      placeholder="Department"
                      style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                    />

                  </div>
                  <CompanyDropdown value={pCompany} onChange={setPCompany} />
                </>
              )}

              {/* ── Reference article ── */}
              {selectedType === "article" && (
                <>
                  <div
                    onClick={() => aFileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setADragging(true); }}
                    onDragLeave={() => setADragging(false)}
                    onDrop={(e) => { e.preventDefault(); setADragging(false); const f = e.dataTransfer.files[0]; if (f) setAFile(f); }}
                    style={{ ...dropzoneBase, border: `1.5px dashed ${aDragging ? "var(--foreground)" : "var(--card-border)"}`, background: aDragging ? "var(--card-hover-bg)" : "var(--sidebar-bg)" }}
                  >
                    <input ref={aFileRef} type="file" accept={acceptAttr} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setAFile(f); }} />
                    <span style={{ fontSize: 13, color: aFile ? "var(--foreground)" : "var(--muted-light)" }}>
                      {aFile ? aFile.name : `Drop a ${acceptLabel} file here, or click to browse`}
                    </span>
                    {!aFile && <div style={{ fontSize: 11, color: "var(--muted-light)", marginTop: 4 }}>{acceptLabel}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <input
                      className="search-input"
                      required
                      value={aTitle}
                      onChange={(e) => setATitle(e.target.value)}
                      placeholder="Title"
                      style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                    />
                    <input
                      className="search-input"
                      list="dept-options"
                      required
                      value={aDept}
                      onChange={(e) => setADept(e.target.value)}
                      placeholder="Department"
                      style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                    />
                  </div>
                  <input
                    className="search-input"
                    value={aWorkflow}
                    onChange={(e) => setAWorkflow(e.target.value)}
                    placeholder="Related workflow (optional) — link to an existing workflow"
                    style={{ width: "100%", padding: "9px 14px", fontSize: 13, borderRadius: 8, marginBottom: 14, boxSizing: "border-box" }}
                  />
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 8 }}>Appears under</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        { key: "how_to_guide", label: "How-to guides" },
                        { key: "training_material", label: "Training material" },
                      ].map(({ key, label }) => {
                        const active = aAppearsAs.has(key);
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
                  <CompanyDropdown value={aCompany} onChange={setACompany} />
                </>
              )}

              {/* ── Video guide ── */}
              {selectedType === "video" && (
                <>
                  <div
                    onClick={() => vFileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setVDragging(true); }}
                    onDragLeave={() => setVDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setVDragging(false); const f = e.dataTransfer.files[0]; if (f) setVFile(f); }}
                    style={{ ...dropzoneBase, border: `1.5px dashed ${vDragging ? "var(--foreground)" : "var(--card-border)"}`, background: vDragging ? "var(--card-hover-bg)" : "var(--sidebar-bg)" }}
                  >
                    <input ref={vFileRef} type="file" accept={acceptAttr} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setVFile(f); }} />
                    <span style={{ fontSize: 13, color: vFile ? "var(--foreground)" : "var(--muted-light)" }}>
                      {vFile ? vFile.name : `Drop a ${acceptLabel} transcript file here, or click to browse`}
                    </span>
                    {!vFile && <div style={{ fontSize: 11, color: "var(--muted-light)", marginTop: 4 }}>{acceptLabel} only</div>}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <input
                      className="search-input"
                      required
                      value={vTitle}
                      onChange={(e) => setVTitle(e.target.value)}
                      placeholder="Video title"
                      style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                    />
                    <input
                      className="search-input"
                      list="dept-options"
                      required
                      value={vDept}
                      onChange={(e) => setVDept(e.target.value)}
                      placeholder="Department"
                      style={{ flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 8 }}
                    />
                  </div>
                  <input
                    className="search-input"
                    required
                    value={vEmbedUrl}
                    onChange={(e) => setVEmbedUrl(e.target.value)}
                    placeholder="Paste SharePoint embed code or URL"
                    style={{ width: "100%", padding: "9px 14px", fontSize: 13, borderRadius: 8, marginBottom: 14, boxSizing: "border-box" }}
                  />
                  <CompanyDropdown value={vCompany} onChange={setVCompany} />
                </>
              )}

              {/* ── SED ── */}
              {selectedType === "sed" && (
                <>
                  <div
                    onClick={() => sFileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setSDragging(true); }}
                    onDragLeave={() => setSDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setSDragging(false);
                      const files = Array.from(e.dataTransfer.files);
                      if (files.length > 0) {
                        setSFiles(files.map((f) => ({ id: `${f.name}-${f.lastModified}-${Math.random()}`, file: f, status: "pending" })));
                        setSSummary(null);
                      }
                    }}
                    style={{ ...dropzoneBase, border: `1.5px dashed ${sDragging ? "var(--foreground)" : "var(--card-border)"}`, background: sDragging ? "var(--card-hover-bg)" : "var(--sidebar-bg)" }}
                  >
                    <input
                      ref={sFileRef}
                      type="file"
                      accept={acceptAttr}
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const files = e.target.files ? Array.from(e.target.files) : [];
                        if (files.length > 0) {
                          setSFiles(files.map((f) => ({ id: `${f.name}-${f.lastModified}-${Math.random()}`, file: f, status: "pending" })));
                          setSSummary(null);
                        }
                      }}
                    />
                    <span style={{ fontSize: 13, color: sFiles.length > 0 ? "var(--foreground)" : "var(--muted-light)" }}>
                      {sFiles.length > 0 ? sFiles.map((f) => f.file.name).join(", ") : `Drop one or more ${acceptLabel} files here, or click to browse`}
                    </span>
                    {sFiles.length === 0 && <div style={{ fontSize: 11, color: "var(--muted-light)", marginTop: 4 }}>{acceptLabel} only</div>}
                  </div>

                  {sFiles.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                      {sFiles.map((f) => (
                        <div
                          key={f.id}
                          style={{
                            display: "flex", flexDirection: "column", gap: 2,
                            fontSize: 12, padding: "6px 10px", borderRadius: 6,
                            border: "1px solid var(--card-border)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <span style={{ color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {f.file.name}
                            </span>
                            <span
                              style={{
                                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                                background: SED_STATUS_COLORS[f.status].bg, color: SED_STATUS_COLORS[f.status].fg,
                                textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap",
                              }}
                            >
                              {f.status}
                            </span>
                          </div>
                          {f.status === "error" && f.error && (
                            <span style={{ fontSize: 11, color: "#b91c1c" }}>{f.error}</span>
                          )}
                          {f.status === "success" && f.ticketNumber && f.projectTitle && (
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{f.ticketNumber} — {f.projectTitle}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {sSummary && (
                    <p style={{ fontSize: 12, color: "var(--foreground)", margin: "0 0 14px", fontWeight: 600 }}>
                      {sSummary.succeeded} succeeded, {sSummary.failed} failed
                    </p>
                  )}
                  <div style={{
                    border: "0.5px solid var(--card-border)", borderRadius: 8,
                    padding: "12px 16px", marginBottom: 14, background: "var(--sidebar-bg)",
                    fontSize: 12, color: "var(--muted)", lineHeight: 1.8,
                  }}>
                    <strong style={{ fontWeight: 600, display: "block", marginBottom: 6, color: "var(--foreground)" }}>
                      Fields extracted automatically
                    </strong>
                    Project title · Story number · INC ticket · CAB ticket · Requestor · Programmer ·
                    Business requirements · IT design · Unit testing · Acceptance testing
                  </div>
                  <CompanyDropdown value={sCompany} onChange={setSCompany} />
                </>
              )}

              <datalist id="dept-options">
                {departments.map((d) => (<option key={d} value={d} />))}
              </datalist>

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
                  {loading ? "Processing…" : selectedType === "article" ? "Upload and publish" : "Upload and process"}
                </button>
              </div>

              {/* Progress */}
              {loading && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{stage}</span>
                    <span style={{ fontSize: 12, color: "var(--muted-light)" }}>{progress}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: "var(--card-border)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, background: "var(--foreground)", width: `${progress}%`, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              )}

              {/* Result */}
              {result && (
                <div style={{ marginTop: 16, fontSize: 13 }}>
                  {result.type === "process" && result.rulesExtracted > 0 && (
                    <span style={{ color: "#15803d" }}>
                      Extracted {result.rulesExtracted} rule{result.rulesExtracted !== 1 ? "s" : ""} from{" "}
                      {result.workflowId
                        ? <a href={`/workflow/${result.workflowId}`} style={{ color: "#15803d", fontWeight: 500 }}>{result.workflowName}</a>
                        : <strong>{result.workflowName}</strong>
                      }
                    </span>
                  )}
                  {result.type === "process" && result.rulesExtracted === 0 && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", color: "#92400e", borderRadius: 8, padding: "10px 14px", lineHeight: 1.6 }}>
                      No business rules were found in this document. It has been saved as a How-to Guide instead and is available in the{" "}
                      {result.articleId
                        ? <a href={`/article/${result.articleId}`} style={{ color: "#92400e", fontWeight: 500 }}>Reference Articles</a>
                        : "Reference Articles"
                      }{" "}section.
                    </div>
                  )}
                  {result.type === "article" && (
                    <span style={{ color: "#15803d" }}>
                      Published{" "}
                      {result.articleId
                        ? <a href={`/article/${result.articleId}`} style={{ color: "#15803d", fontWeight: 500 }}>{result.title}</a>
                        : <strong>{result.title}</strong>
                      }
                    </span>
                  )}
                  {result.type === "sed" && (
                    <span style={{ color: "#15803d" }}>
                      Processed SED{" "}
                      <a href={`/sed/${result.sedId}`} style={{ color: "#15803d", fontWeight: 500 }}>
                        {result.ticketNumber} — {result.projectTitle}
                      </a>
                    </span>
                  )}
                  {result.type === "video" && (
                    <span style={{ color: "#15803d" }}>
                      Published{" "}
                      {result.videoId
                        ? <a href={`/video/${result.videoId}`} style={{ color: "#15803d", fontWeight: 500 }}>{result.title}</a>
                        : <strong>{result.title}</strong>
                      }
                    </span>
                  )}
                </div>
              )}

              {/* Error */}
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
