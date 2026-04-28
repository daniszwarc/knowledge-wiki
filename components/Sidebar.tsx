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
  department: string | null;
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

type Section = "businessRules" | "referenceArticles" | "seds";
type SubSection = "howToGuides" | "trainingMaterial";

function detectActive(
  nav: SidebarNavData,
  activeWorkflowId?: string,
  activeArticleId?: string
): { section: Section | null; dept: string | null; subSection: SubSection | null } {
  if (activeWorkflowId) {
    for (const d of nav.businessRules) {
      if (d.workflows.some((w) => w.id === activeWorkflowId)) {
        return { section: "businessRules", dept: `businessRules:${d.department}`, subSection: null };
      }
    }
  }
  if (activeArticleId) {
    for (const d of nav.howToGuides) {
      if (d.articles.some((a) => a.id === activeArticleId)) {
        return { section: "referenceArticles", dept: `howToGuides:${d.department}`, subSection: "howToGuides" };
      }
    }
    for (const d of nav.trainingMaterial) {
      if (d.articles.some((a) => a.id === activeArticleId)) {
        return { section: "referenceArticles", dept: `trainingMaterial:${d.department}`, subSection: "trainingMaterial" };
      }
    }
  }
  return { section: null, dept: null, subSection: null };
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

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "9px 16px 8px",
        background: "none", border: "none", cursor: "pointer",
        fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
        color: "var(--foreground)",
      }}
    >
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      <ChevronIcon rotated={open} />
    </button>
  );
}

function SubSectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 6,
        padding: "5px 16px 5px 24px",
        background: "none", border: "none", cursor: "pointer",
        fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
        color: "var(--muted)",
      }}
    >
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      <ChevronIcon rotated={open} />
    </button>
  );
}

function DeptHeader({ label, badge, open, onToggle }: {
  label: string; badge?: string; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 6,
        padding: "5px 16px 5px 28px",
        background: "none", border: "none", cursor: "pointer",
        fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
        color: "var(--muted)",
      }}
    >
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {badge !== undefined && (
        <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted-light)", marginRight: 2 }}>{badge}</span>
      )}
      <ChevronIcon rotated={open} />
    </button>
  );
}

function SubDeptHeader({ label, badge, open, onToggle }: {
  label: string; badge?: string; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 6,
        padding: "5px 16px 5px 36px",
        background: "none", border: "none", cursor: "pointer",
        fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
        color: "var(--muted)",
      }}
    >
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {badge !== undefined && (
        <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted-light)", marginRight: 2 }}>{badge}</span>
      )}
      <ChevronIcon rotated={open} />
    </button>
  );
}

function ArticleLink({ article, active }: { article: NavArticle; active: boolean }) {
  return (
    <a
      href={`/article/${article.id}`}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 8px", fontSize: 12,
        color: active ? "var(--foreground)" : "var(--muted)",
        fontWeight: active ? 600 : 400,
        background: active ? "var(--card-hover-bg)" : "none",
        textDecoration: "none", borderRadius: 5,
        borderLeft: active ? "2px solid var(--foreground)" : "2px solid transparent",
        marginLeft: -2,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--card-hover-bg)"; e.currentTarget.style.color = "var(--foreground)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted)"; } }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
        background: article.stakeholder_validated ? "#4ade80" : "#f59e0b",
        opacity: article.stakeholder_validated ? 0.8 : 0.5,
      }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {article.title}
      </span>
    </a>
  );
}

const SECTION_SEPARATOR = (
  <div style={{ height: 1, background: "var(--sidebar-border)", margin: "4px 0" }} />
);

export function Sidebar({
  activeWorkflowId,
  activeArticleId,
  activeSedId,
  me,
  refreshKey,
}: {
  activeWorkflowId?: string;
  activeArticleId?: string;
  activeSedId?: string;
  me?: Me | null;
  refreshKey?: number;
}) {
  const [nav, setNav] = useState<SidebarNavData | null>(null);
  const [seds, setSeds] = useState<NavSed[]>([]);
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
    businessRules: false,
    referenceArticles: false,
    seds: false,
  });
  const [openSubSections, setOpenSubSections] = useState<Record<SubSection, boolean>>({
    howToGuides: false,
    trainingMaterial: false,
  });
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const initialized = useRef(false);

  useEffect(() => {
    fetch("/api/nav")
      .then((r) => r.json())
      .then((data: SidebarNavData) => {
        setNav(data);
        if (!initialized.current) {
          initialized.current = true;
          const { section, dept, subSection } = detectActive(data, activeWorkflowId, activeArticleId);
          if (section) {
            setOpenSections((p) => ({ ...p, [section]: true }));
            if (subSection) {
              setOpenSubSections((p) => ({ ...p, [subSection]: true }));
            }
            if (dept) {
              setOpenDepts((p) => ({ ...p, [dept]: true }));
            }
          }
          if (activeSedId) {
            setOpenSections((p) => ({ ...p, seds: true }));
          }
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkflowId, activeArticleId, activeSedId, refreshKey]);

  useEffect(() => {
    if (!openSections.seds) return;
    fetch("/api/seds")
      .then((r) => r.json())
      .then((data: NavSed[]) => setSeds(data))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSections.seds]);

  function toggleSection(s: Section) {
    setOpenSections((p) => ({ ...p, [s]: !p[s] }));
  }

  function toggleSubSection(s: SubSection) {
    setOpenSubSections((p) => ({ ...p, [s]: !p[s] }));
  }

  function toggleDept(key: string) {
    setOpenDepts((p) => ({ ...p, [key]: !p[key] }));
  }

  function isDeptOpen(key: string) {
    return !!openDepts[key];
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
        {nav && (
          <>
            {/* ── Business Rules ── */}
            <SectionHeader
              label="Business Rules"
              open={openSections.businessRules}
              onToggle={() => toggleSection("businessRules")}
            />
            {openSections.businessRules && nav.businessRules.map((d) => {
              const totalRules = d.workflows.reduce((sum, w) => sum + Number(w.rule_count), 0);
              const key = `businessRules:${d.department}`;
              const open = isDeptOpen(key);
              return (
                <div key={d.department}>
                  <DeptHeader
                    label={d.department}
                    badge={String(totalRules)}
                    open={open}
                    onToggle={() => toggleDept(key)}
                  />
                  {open && (
                    <div style={{ marginLeft: 28, paddingLeft: 10, borderLeft: "1px solid var(--card-border)", marginBottom: 2 }}>
                      {d.workflows.map((w) => {
                        const active = w.id === activeWorkflowId;
                        return (
                          <a
                            key={w.id}
                            href={`/workflow/${w.id}`}
                            style={{
                              display: "block", padding: "5px 8px", fontSize: 12,
                              color: active ? "var(--foreground)" : "var(--muted)",
                              fontWeight: active ? 600 : 400,
                              background: active ? "var(--card-hover-bg)" : "none",
                              borderRadius: 5, textDecoration: "none",
                              borderLeft: active ? "2px solid var(--foreground)" : "2px solid transparent",
                              marginLeft: -2,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}
                            onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--card-hover-bg)"; e.currentTarget.style.color = "var(--foreground)"; } }}
                            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted)"; } }}
                          >
                            {w.name}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {SECTION_SEPARATOR}

            {/* ── Reference Articles ── */}
            <SectionHeader
              label="Reference Articles"
              open={openSections.referenceArticles}
              onToggle={() => toggleSection("referenceArticles")}
            />
            {openSections.referenceArticles && (
              <>
                {/* How-to guides sub-section */}
                <SubSectionHeader
                  label="How-to guides"
                  open={openSubSections.howToGuides}
                  onToggle={() => toggleSubSection("howToGuides")}
                />
                {openSubSections.howToGuides && nav.howToGuides.map((d) => {
                  const key = `howToGuides:${d.department}`;
                  const open = isDeptOpen(key);
                  return (
                    <div key={d.department}>
                      <SubDeptHeader
                        label={d.department}
                        open={open}
                        onToggle={() => toggleDept(key)}
                      />
                      {open && (
                        <div style={{ marginLeft: 36, paddingLeft: 10, borderLeft: "1px solid var(--card-border)", marginBottom: 2 }}>
                          {d.articles.map((a) => (
                            <ArticleLink key={a.id} article={a} active={a.id === activeArticleId} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Training material sub-section */}
                <SubSectionHeader
                  label="Training material"
                  open={openSubSections.trainingMaterial}
                  onToggle={() => toggleSubSection("trainingMaterial")}
                />
                {openSubSections.trainingMaterial && nav.trainingMaterial.map((d) => {
                  const key = `trainingMaterial:${d.department}`;
                  const open = isDeptOpen(key);
                  return (
                    <div key={d.department}>
                      <SubDeptHeader
                        label={d.department}
                        open={open}
                        onToggle={() => toggleDept(key)}
                      />
                      {open && (
                        <div style={{ marginLeft: 36, paddingLeft: 10, borderLeft: "1px solid var(--card-border)", marginBottom: 2 }}>
                          {d.articles.map((a) => (
                            <ArticleLink key={a.id} article={a} active={a.id === activeArticleId} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {SECTION_SEPARATOR}

            {/* ── SEDs ── */}
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <a
                href="/seds"
                style={{
                  flex: 1, padding: "9px 0 8px 16px",
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                  color: "var(--foreground)", textDecoration: "none",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                SEDs
              </a>
              <button
                onClick={() => toggleSection("seds")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "9px 16px 8px 8px",
                  display: "flex", alignItems: "center",
                }}
              >
                <ChevronIcon rotated={openSections.seds} />
              </button>
            </div>
            {openSections.seds && (
              <>
                {(() => {
                  const grouped: Record<string, NavSed[]> = {};
                  for (const s of seds) {
                    const dept = s.department ?? "Other";
                    if (!grouped[dept]) grouped[dept] = [];
                    grouped[dept].push(s);
                  }
                  return Object.entries(grouped).map(([dept, items]) => {
                    const key = `seds:${dept}`;
                    const open = isDeptOpen(key);
                    return (
                      <div key={dept}>
                        <DeptHeader
                          label={dept}
                          badge={String(items.length)}
                          open={open}
                          onToggle={() => toggleDept(key)}
                        />
                        {open && (
                          <div style={{ marginLeft: 28, paddingLeft: 10, borderLeft: "1px solid var(--card-border)", marginBottom: 2 }}>
                            {items.map((s) => {
                              const active = s.id === activeSedId;
                              const label = `${s.ticket_number} — ${s.project_title}`.slice(0, 40);
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
                                  {label}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </>
            )}
          </>
        )}
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
