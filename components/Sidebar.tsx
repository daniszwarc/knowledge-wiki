"use client";

import { useEffect, useRef, useState } from "react";

interface NavWorkflow {
  id: string;
  name: string;
  completeness_score: number;
  rule_count: string;
}

interface NavArticle {
  id: string;
  title: string;
  stakeholder_validated: boolean;
}

interface NavDeptWorkflows {
  department: string;
  workflows: NavWorkflow[];
}

interface NavDeptArticles {
  department: string;
  articles: NavArticle[];
}

interface NavSed {
  id: string;
  ticket_number: string;
  project_title: string;
  date: string | null;
  created_at: string;
}

interface NavVideo {
  id: string;
  title: string;
  department: string;
}

interface SidebarNavData {
  businessRules: NavDeptWorkflows[];
  howToGuides: NavDeptArticles[];
  trainingMaterial: NavDeptArticles[];
}

interface Me {
  id: string;
  email: string;
  role: string;
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
  processing_type: "rules" | "article" | "sed" | "video" | string;
}

function ChevronIcon({ rotated }: { rotated: boolean }) {
  return (
    <svg
      width={12} height={12}
      fill="none" stroke="currentColor" strokeWidth={2}
      viewBox="0 0 24 24"
      style={{
        display: "block", flexShrink: 0,
        transition: "transform 0.15s",
        transform: rotated ? "rotate(90deg)" : "none",
        color: "var(--muted-light)",
      }}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

const DEPTH_STYLE: Record<number, { paddingLeft: number; fontSize: number; fontWeight: number; color: string }> = {
  0: { paddingLeft: 16, fontSize: 12, fontWeight: 700, color: "var(--foreground)" },
  1: { paddingLeft: 24, fontSize: 11, fontWeight: 600, color: "var(--muted)" },
  2: { paddingLeft: 36, fontSize: 10, fontWeight: 600, color: "var(--muted)" },
  3: { paddingLeft: 44, fontSize: 10, fontWeight: 600, color: "var(--muted)" },
};

function NavHeader({ label, depth, badge, open, onToggle, href }: {
  label: string; depth: number; badge?: string; open: boolean; onToggle: () => void; href?: string;
}) {
  const s = DEPTH_STYLE[depth] ?? DEPTH_STYLE[3];
  const textStyle: React.CSSProperties = {
    flex: 1, textAlign: "left",
    textTransform: depth === 0 || depth === 1 ? "uppercase" : "uppercase",
    letterSpacing: depth === 0 ? "0.07em" : "0.05em",
  };

  if (href) {
    return (
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        <a
          href={href}
          style={{
            ...textStyle,
            padding: `9px 0 8px ${s.paddingLeft}px`,
            fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color, textDecoration: "none",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {label}
        </a>
        <button
          onClick={onToggle}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "9px 16px 8px 8px", display: "flex", alignItems: "center" }}
        >
          <ChevronIcon rotated={open} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 6,
        padding: `5px 16px 5px ${s.paddingLeft}px`,
        background: "none", border: "none", cursor: "pointer",
        fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color,
      }}
    >
      <span style={textStyle}>{label}</span>
      {badge !== undefined && (
        <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted-light)", marginRight: 2 }}>{badge}</span>
      )}
      <ChevronIcon rotated={open} />
    </button>
  );
}

function ItemLink({ href, label, active, dot }: { href: string; label: string; active: boolean; dot?: string }) {
  return (
    <a
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 8px", fontSize: 12,
        color: active ? "var(--foreground)" : "var(--muted)",
        fontWeight: active ? 600 : 400,
        background: active ? "var(--card-hover-bg)" : "none",
        textDecoration: "none", borderRadius: 5,
        borderLeft: active ? "2px solid var(--foreground)" : "2px solid transparent",
        marginLeft: -2,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--card-hover-bg)"; e.currentTarget.style.color = "var(--foreground)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted)"; } }}
    >
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: dot, opacity: 0.8 }} />
      )}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </a>
  );
}

function ItemGroup({ depth, children }: { depth: number; children: React.ReactNode }) {
  const marginLeft = (DEPTH_STYLE[depth]?.paddingLeft ?? 36) - 8;
  return (
    <div style={{ marginLeft, paddingLeft: 10, borderLeft: "1px solid var(--card-border)", marginBottom: 2 }}>
      {children}
    </div>
  );
}

const SECTION_SEPARATOR = (
  <div style={{ height: 1, background: "var(--sidebar-border)", margin: "4px 0" }} />
);

export function Sidebar({
  activeWorkflowId,
  activeArticleId,
  activeSedId,
  activeVideoId,
  me,
  refreshKey,
}: {
  activeWorkflowId?: string;
  activeArticleId?: string;
  activeSedId?: string;
  activeVideoId?: string;
  me?: Me | null;
  refreshKey?: number;
}) {
  const [platforms, setPlatforms] = useState<Platform[] | null>(null);
  const [categoriesByPlatform, setCategoriesByPlatform] = useState<Record<string, Category[]>>({});
  const [nav, setNav] = useState<SidebarNavData | null>(null);
  const [seds, setSeds] = useState<NavSed[]>([]);
  const [videos, setVideos] = useState<NavVideo[]>([]);

  const [openPlatforms, setOpenPlatforms] = useState<Record<string, boolean>>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openSubSections, setOpenSubSections] = useState<Record<string, boolean>>({});
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [sedSearch, setSedSearch] = useState("");
  const initialized = useRef(false);

  const sedCategoryOpen = Object.entries(openCategories).some(
    ([id, open]) => open && Object.values(categoriesByPlatform).flat().find((c) => c.id === id)?.processing_type === "sed"
  );
  const videoCategoryOpen = Object.entries(openCategories).some(
    ([id, open]) => open && Object.values(categoriesByPlatform).flat().find((c) => c.id === id)?.processing_type === "video"
  );

  // Load platforms + their categories
  useEffect(() => {
    fetch("/api/platforms/user")
      .then((r) => r.json())
      .then(async (platformList: Platform[]) => {
        setPlatforms(platformList);
        const entries = await Promise.all(
          platformList.map(async (p) => {
            const cats = await fetch(`/api/categories?platform_id=${p.id}`).then((r) => r.ok ? r.json() : []);
            return [p.id, cats] as const;
          })
        );
        const map: Record<string, Category[]> = {};
        for (const [id, cats] of entries) map[id] = cats;
        setCategoriesByPlatform(map);
        setOpenPlatforms((prev) => {
          const next = { ...prev };
          for (const p of platformList) if (!(p.id in next)) next[p.id] = true;
          return next;
        });
      });
  }, []);

  // Load department-grouped workflows/articles
  useEffect(() => {
    fetch("/api/nav")
      .then((r) => r.json())
      .then((data: SidebarNavData) => setNav(data));
  }, [refreshKey]);

  // Auto-open the relevant platform/category/department when an active item is passed in
  useEffect(() => {
    if (initialized.current) return;
    if (!platforms || !nav) return;
    initialized.current = true;

    const allCats = platforms.flatMap((p) => (categoriesByPlatform[p.id] ?? []).map((c) => ({ ...c, platformId: p.id })));

    function openFor(processingType: string) {
      const cat = allCats.find((c) => c.processing_type === processingType);
      if (!cat) return null;
      setOpenPlatforms((prev) => ({ ...prev, [cat.platformId]: true }));
      setOpenCategories((prev) => ({ ...prev, [cat.id]: true }));
      return cat;
    }

    if (activeWorkflowId) {
      const dept = nav.businessRules.find((d) => d.workflows.some((w) => w.id === activeWorkflowId));
      const cat = openFor("rules");
      if (cat && dept) setOpenDepts((prev) => ({ ...prev, [`${cat.id}:${dept.department}`]: true }));
    }
    if (activeArticleId) {
      let dept = nav.howToGuides.find((d) => d.articles.some((a) => a.id === activeArticleId));
      const sub = dept ? "howToGuides" : "trainingMaterial";
      if (!dept) dept = nav.trainingMaterial.find((d) => d.articles.some((a) => a.id === activeArticleId));
      const cat = openFor("article");
      if (cat) {
        setOpenSubSections((prev) => ({ ...prev, [`${cat.id}:${sub}`]: true }));
        if (dept) setOpenDepts((prev) => ({ ...prev, [`${cat.id}:${sub}:${dept!.department}`]: true }));
      }
    }
    if (activeSedId) openFor("sed");
    if (activeVideoId) openFor("video");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms, nav, activeWorkflowId, activeArticleId, activeSedId, activeVideoId]);

  useEffect(() => {
    if (!sedCategoryOpen) return;
    fetch("/api/seds")
      .then((r) => r.json())
      .then((data: NavSed[]) => setSeds(data))
      .catch(() => {});
  }, [sedCategoryOpen]);

  useEffect(() => {
    if (!videoCategoryOpen) return;
    fetch("/api/videos")
      .then((r) => r.json())
      .then((data: NavVideo[]) => setVideos(data))
      .catch(() => {});
  }, [videoCategoryOpen]);

  useEffect(() => {
    const handler = () => {
      fetch("/api/nav").then((r) => r.json()).then((data: SidebarNavData) => setNav(data));
      if (sedCategoryOpen) {
        fetch("/api/seds").then((r) => r.json()).then((data: NavSed[]) => setSeds(data)).catch(() => {});
      }
      if (videoCategoryOpen) {
        fetch("/api/videos").then((r) => r.json()).then((data: NavVideo[]) => setVideos(data)).catch(() => {});
      }
    };
    window.addEventListener("wiki:content-updated", handler);
    return () => window.removeEventListener("wiki:content-updated", handler);
  }, [sedCategoryOpen, videoCategoryOpen]);

  function togglePlatform(id: string) {
    setOpenPlatforms((p) => ({ ...p, [id]: !p[id] }));
  }
  function toggleCategory(id: string) {
    setOpenCategories((p) => ({ ...p, [id]: !p[id] }));
  }
  function toggleSubSection(key: string) {
    setOpenSubSections((p) => ({ ...p, [key]: !p[key] }));
  }
  function toggleDept(key: string) {
    setOpenDepts((p) => ({ ...p, [key]: !p[key] }));
  }

  function renderRulesCategory(cat: Category) {
    if (!nav) return null;
    return (
      <div key={cat.id}>
        <NavHeader label={cat.name} depth={1} open={!!openCategories[cat.id]} onToggle={() => toggleCategory(cat.id)} />
        {openCategories[cat.id] && nav.businessRules.map((d) => {
          const totalRules = d.workflows.reduce((sum, w) => sum + Number(w.rule_count), 0);
          const key = `${cat.id}:${d.department}`;
          const open = !!openDepts[key];
          return (
            <div key={d.department}>
              <NavHeader label={d.department} depth={2} badge={String(totalRules)} open={open} onToggle={() => toggleDept(key)} />
              {open && (
                <ItemGroup depth={2}>
                  {d.workflows.map((w) => (
                    <ItemLink key={w.id} href={`/workflow/${w.id}`} label={w.name} active={w.id === activeWorkflowId} />
                  ))}
                </ItemGroup>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderArticleCategory(cat: Category) {
    if (!nav) return null;
    const groups: { key: "howToGuides" | "trainingMaterial"; label: string; data: NavDeptArticles[] }[] = [
      { key: "howToGuides", label: "How-to guides", data: nav.howToGuides },
      { key: "trainingMaterial", label: "Training material", data: nav.trainingMaterial },
    ];
    return (
      <div key={cat.id}>
        <NavHeader label={cat.name} depth={1} open={!!openCategories[cat.id]} onToggle={() => toggleCategory(cat.id)} />
        {openCategories[cat.id] && groups.map((g) => {
          const subKey = `${cat.id}:${g.key}`;
          const subOpen = !!openSubSections[subKey];
          return (
            <div key={g.key}>
              <NavHeader label={g.label} depth={2} open={subOpen} onToggle={() => toggleSubSection(subKey)} />
              {subOpen && g.data.map((d) => {
                const deptKey = `${subKey}:${d.department}`;
                const deptOpen = !!openDepts[deptKey];
                return (
                  <div key={d.department}>
                    <NavHeader label={d.department} depth={3} open={deptOpen} onToggle={() => toggleDept(deptKey)} />
                    {deptOpen && (
                      <ItemGroup depth={3}>
                        {d.articles.map((a) => (
                          <ItemLink
                            key={a.id}
                            href={`/article/${a.id}`}
                            label={a.title}
                            active={a.id === activeArticleId}
                            dot={a.stakeholder_validated ? "#4ade80" : "#f59e0b"}
                          />
                        ))}
                      </ItemGroup>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  function renderVideoCategory(cat: Category) {
    const grouped: Record<string, NavVideo[]> = {};
    for (const v of videos) {
      if (!grouped[v.department]) grouped[v.department] = [];
      grouped[v.department].push(v);
    }
    return (
      <div key={cat.id}>
        <NavHeader label={cat.name} depth={1} open={!!openCategories[cat.id]} onToggle={() => toggleCategory(cat.id)} />
        {openCategories[cat.id] && Object.entries(grouped).map(([dept, items]) => {
          const key = `${cat.id}:${dept}`;
          const open = !!openDepts[key];
          return (
            <div key={dept}>
              <NavHeader label={dept} depth={2} badge={String(items.length)} open={open} onToggle={() => toggleDept(key)} />
              {open && (
                <ItemGroup depth={2}>
                  {items.map((v) => (
                    <ItemLink key={v.id} href={`/video/${v.id}`} label={`▶ ${v.title}`} active={v.id === activeVideoId} />
                  ))}
                </ItemGroup>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderSedCategory(cat: Category) {
    const q = sedSearch.trim().toLowerCase();
    const filtered = q
      ? seds.filter((s) => s.ticket_number.toLowerCase().includes(q) || s.project_title.toLowerCase().includes(q))
      : seds;
    const sorted = [...filtered].sort((a, b) => {
      const da = a.date ?? a.created_at ?? "";
      const db = b.date ?? b.created_at ?? "";
      return db.localeCompare(da);
    });
    return (
      <div key={cat.id}>
        <NavHeader label={cat.name} depth={1} href="/seds" open={!!openCategories[cat.id]} onToggle={() => toggleCategory(cat.id)} />
        {openCategories[cat.id] && (
          <div style={{ padding: "2px 16px 8px 24px" }}>
            <input
              type="text"
              value={sedSearch}
              onChange={(e) => setSedSearch(e.target.value)}
              placeholder="Search SED # or title…"
              style={{
                width: "100%", boxSizing: "border-box",
                fontSize: 12, padding: "6px 8px", borderRadius: 6,
                border: "1px solid var(--card-border)",
                background: "var(--sidebar-bg)", color: "var(--foreground)",
                outline: "none", marginBottom: 4,
              }}
            />
            {sorted.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--muted-light)", padding: "6px 8px", margin: 0 }}>No SEDs found.</p>
            ) : (
              <div>
                {sorted.map((s) => {
                  const active = s.id === activeSedId;
                  const dateStr = (s.date ?? s.created_at ?? "").slice(0, 10) || "—";
                  return (
                    <a
                      key={s.id}
                      href={`/sed/${s.id}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 8px", fontSize: 12,
                        color: active ? "var(--foreground)" : "var(--muted)",
                        fontWeight: active ? 600 : 400,
                        background: active ? "var(--card-hover-bg)" : "none",
                        textDecoration: "none", borderRadius: 5,
                        borderLeft: active ? "2px solid var(--foreground)" : "2px solid transparent",
                        marginLeft: -2,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}
                      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--card-hover-bg)"; e.currentTarget.style.color = "var(--foreground)"; } }}
                      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted)"; } }}
                    >
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {`${s.ticket_number} — ${s.project_title}`.slice(0, 40)}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--muted-light)", flexShrink: 0 }}>{dateStr}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderCategory(cat: Category) {
    switch (cat.processing_type) {
      case "rules": return renderRulesCategory(cat);
      case "article": return renderArticleCategory(cat);
      case "video": return renderVideoCategory(cat);
      case "sed": return renderSedCategory(cat);
      default: return null;
    }
  }

  return (
    <aside className="sidebar" style={{ width: 256, flexShrink: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>

      {/* Brand */}
      <div
        style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--sidebar-border)", cursor: "pointer" }}
        onClick={() => { window.location.href = "/"; }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "var(--muted)" }}>
          APi GROUP - Knowledge Wiki
        </span>
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, paddingTop: 4, overflowY: "auto" }}>
        {platforms && platforms.map((p, pIdx) => {
          const cats = categoriesByPlatform[p.id] ?? [];
          return (
            <div key={p.id}>
              <NavHeader label={p.name} depth={0} open={!!openPlatforms[p.id]} onToggle={() => togglePlatform(p.id)} />
              {openPlatforms[p.id] && cats.map((c, cIdx) => (
                <div key={c.id}>
                  {renderCategory(c)}
                  {cIdx < cats.length - 1 && SECTION_SEPARATOR}
                </div>
              ))}
              {pIdx < platforms.length - 1 && SECTION_SEPARATOR}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px 14px 80px", borderTop: "1px solid var(--sidebar-border)" }}>
        {me && ["editor", "admin", "developer"].includes(me.role) && (
          <a
            href="/upload"
            style={{
              display: "block", fontSize: 11, fontWeight: 500,
              color: "var(--foreground)", textDecoration: "none",
              padding: "5px 8px", marginBottom: 6, borderRadius: 6,
              border: "1px solid var(--card-border)", textAlign: "center",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-hover-bg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            + Add document
          </a>
        )}
        <a href="/experts" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
          Subject matter experts
        </a>
        <a href="/validate" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
          Validation review
        </a>
        <a href="/gaps" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
          Flagged gaps
        </a>
        {me?.role === "admin" && (
          <a href="/admin/users" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
            Admin
          </a>
        )}
        {me?.role === "admin" && (
          <a href="/admin/seds" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
            SED management
          </a>
        )}
        {(me?.role === "admin" || me?.role === "developer") && (
          <a href="/audit" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "3px 0" }}>
            Audit Log
          </a>
        )}
        {me && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--sidebar-border)" }}>
            <p style={{ fontSize: 11, color: "var(--muted-light)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {me.email}
            </p>
            <p style={{ fontSize: 10, color: "var(--muted-light)", opacity: 0.7, marginBottom: 6, textTransform: "capitalize" }}>
              {me.role}
            </p>
            <a href="/account" style={{ display: "block", fontSize: 11, color: "var(--muted)", textDecoration: "none", padding: "2px 0", marginBottom: 4 }}>
              Account
            </a>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
