"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ChatPanel } from "@/components/ChatPanel";

interface Sed {
  id: string;
  ticket_number: string;
  project_title: string;
  department: string | null;
  author: string | null;
  date: string | null;
  affected_systems: string | null;
  business_requirements: string | null;
  it_design: string | null;
  unit_testing: string | null;
  acceptance_testing: string | null;
  source_filename: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  inc_ticket: string | null;
  cab_ticket: string | null;
  story_number: string | null;
  td_oms_task: string | null;
  requestor: string | null;
  programmer: string | null;
  contributors: string | null;
  approved_by: string | null;
  company: string | null;
  business_requirements_images: string[] | null;
  it_design_images: string[] | null;
  unit_testing_images: string[] | null;
  acceptance_testing_images: string[] | null;
  business_requirements_content: { type: string; value: string }[] | null;
  it_design_content: { type: string; value: string }[] | null;
  unit_testing_content: { type: string; value: string }[] | null;
  acceptance_testing_content: { type: string; value: string }[] | null;
}

const TABS = [
  { key: "business_requirements", label: "User / Business Requirements" },
  { key: "it_design", label: "IT Design" },
  { key: "unit_testing", label: "Unit Testing" },
  { key: "acceptance_testing", label: "QA / Acceptance Testing" },
] as const;

const btnStyle: React.CSSProperties = {
  fontSize: 12, padding: "4px 12px", borderRadius: 6,
  border: "1px solid var(--card-border)", background: "none",
  color: "var(--muted)", cursor: "pointer", textDecoration: "none",
  display: "inline-block", lineHeight: "20px",
};

export default function SedPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [sed, setSed] = useState<Sed | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [me, setMe] = useState<{ id: string; email: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["key"]>("business_requirements");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setMe(data); });
  }, []);

  useEffect(() => {
    fetch(`/api/seds/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data: Sed | null) => {
        if (data) setSed(data);
        setLoading(false);
      });
  }, [id]);

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await fetch(`/api/seds/${id}`, { method: "DELETE" });
      router.push("/");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--muted)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (notFound || !sed) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--muted)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        SED not found.
      </div>
    );
  }

  const canDelete = me && ["editor", "admin", "developer"].includes(me.role);

  const chatContext = [
    `Ticket: ${sed.ticket_number}`,
    `Title: ${sed.project_title}`,
    sed.department ? `Department: ${sed.department}` : null,
    sed.business_requirements ? `\nBusiness Requirements:\n${sed.business_requirements}` : null,
    sed.it_design ? `\nIT Design:\n${sed.it_design}` : null,
    sed.unit_testing ? `\nUnit Testing:\n${sed.unit_testing}` : null,
    sed.acceptance_testing ? `\nAcceptance Testing:\n${sed.acceptance_testing}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const activeContent = sed[activeTab];
  const activeImages = sed[`${activeTab}_images` as keyof Sed] as string[] | null;
  const activeContentItems = sed[`${activeTab}_content` as keyof Sed] as { type: string; value: string }[] | null;

  function renderContent(items: { type: string; value: string }[]) {
    return items.map((item, i) => {
      if (item.type === "image") {
        return (
          <figure key={i} style={{ margin: "16px 0" }}>
            <img
              src={item.value}
              alt="Screenshot"
              style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #e5e7eb", cursor: "pointer" }}
              onClick={() => window.open(item.value, "_blank")}
            />
          </figure>
        );
      }
      return (
        <p key={i} style={{ marginBottom: 8, fontSize: 14, color: "var(--foreground)", lineHeight: 1.7 }}>
          {item.value}
        </p>
      );
    });
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      <Sidebar me={me} activeSedId={id} />

      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", borderRight: "1px solid var(--sidebar-border)" }}>

        {/* Top bar */}
        <div style={{ borderBottom: "1px solid var(--sidebar-border)", padding: "12px 32px", display: "flex", alignItems: "center", gap: 10 }}>
          <a href="/" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
            <span>←</span> All content
          </a>
          {sed.source_filename && (
            <span style={{ marginLeft: "auto" }}>
              <a
                href={`/uploads/${sed.source_filename}`}
                download={sed.source_filename}
                style={btnStyle}
              >
                ↓ {sed.source_filename}
              </a>
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ maxWidth: 720, width: "100%", padding: "48px 32px 80px", overflowWrap: "break-word", wordBreak: "break-word" }}>

          {/* Department badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            {sed.department && (
              <span style={{
                fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99,
                border: "1px solid var(--card-border)", background: "var(--sidebar-bg)", color: "var(--muted)",
              }}>
                {sed.department}
              </span>
            )}
            <span style={{
              fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99,
              border: "1px solid var(--card-border)", background: "var(--sidebar-bg)", color: "var(--muted)",
            }}>
              SED
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.25, marginBottom: 16, letterSpacing: "-0.01em" }}>
            {sed.project_title}
          </h1>

          {/* Meta */}
          <div style={{ fontSize: 12, color: "var(--muted-light)", marginBottom: 40, paddingBottom: 20, borderBottom: "1px solid var(--card-border)" }}>
            {/* Ticket row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              {sed.inc_ticket && <span>Originating Ticket: <strong style={{ color: "var(--foreground)" }}>{sed.inc_ticket}</strong></span>}
              {sed.inc_ticket && sed.cab_ticket && <span style={{ opacity: 0.4 }}>·</span>}
              {sed.cab_ticket && <span>CAB Ticket: <strong style={{ color: "var(--foreground)" }}>{sed.cab_ticket}</strong></span>}
              {(sed.inc_ticket || sed.cab_ticket) && sed.story_number && <span style={{ opacity: 0.4 }}>·</span>}
              {sed.story_number && <span>Story: <strong style={{ color: "var(--foreground)" }}>{sed.story_number}</strong></span>}
              {(sed.inc_ticket || sed.cab_ticket || sed.story_number) && sed.td_oms_task && <span style={{ opacity: 0.4 }}>·</span>}
              {sed.td_oms_task && <span>TD/OMS Task: <strong style={{ color: "var(--foreground)" }}>{sed.td_oms_task}</strong></span>}
              {!sed.inc_ticket && !sed.cab_ticket && !sed.story_number && !sed.td_oms_task && (
                <span>Ticket: <strong style={{ color: "var(--foreground)" }}>{sed.ticket_number}</strong></span>
              )}
            </div>
            {/* People row */}
            {(sed.requestor || sed.programmer || sed.approved_by) && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {sed.requestor && <span>Requestor: {sed.requestor}</span>}
                {sed.requestor && sed.programmer && <span style={{ opacity: 0.4 }}>·</span>}
                {sed.programmer && <span>Programmer: {sed.programmer}</span>}
                {(sed.requestor || sed.programmer) && sed.approved_by && <span style={{ opacity: 0.4 }}>·</span>}
                {sed.approved_by && <span>Approved By: {sed.approved_by}</span>}
              </div>
            )}
          </div>

          {/* Section tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--card-border)", paddingBottom: 0 }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  fontSize: 12, fontWeight: activeTab === tab.key ? 600 : 400,
                  padding: "6px 12px", background: "none", border: "none",
                  borderBottom: activeTab === tab.key ? "2px solid var(--foreground)" : "2px solid transparent",
                  color: activeTab === tab.key ? "var(--foreground)" : "var(--muted)",
                  cursor: "pointer", marginBottom: -1,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Section content */}
          <div
            className="article-prose"
            style={{ lineHeight: 1.8, color: "var(--foreground)", fontSize: 15, minHeight: 120 }}
          >
            {activeContentItems && activeContentItems.length > 0 ? (
              renderContent(activeContentItems)
            ) : activeContent ? (
              <>
                <p style={{ whiteSpace: "pre-wrap" }}>{activeContent}</p>
                {activeImages && activeImages.length > 0 && (
                  <div>
                    {activeImages.map((url, i) => (
                      <figure key={i} style={{ margin: "24px 0" }}>
                        <img
                          src={url}
                          alt="Screenshot"
                          style={{ maxWidth: "100%", borderRadius: "8px", border: "1px solid #e5e7eb", cursor: "pointer" }}
                          onClick={() => window.open(url, "_blank")}
                        />
                      </figure>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: "var(--muted-light)", fontStyle: "italic" }}>Not documented</p>
            )}
          </div>

          {/* Delete */}
          {canDelete && (
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--card-border)" }}>
              {confirmingDelete ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>Are you sure? This cannot be undone.</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    style={{
                      fontSize: 12, padding: "5px 14px", borderRadius: 6,
                      border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
                      cursor: deleteLoading ? "not-allowed" : "pointer", fontWeight: 500,
                      opacity: deleteLoading ? 0.6 : 1,
                    }}
                  >
                    {deleteLoading ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "1px solid var(--card-border)", background: "none", color: "var(--muted)", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  style={{
                    fontSize: 12, padding: "5px 14px", borderRadius: 6,
                    border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
                    cursor: "pointer",
                  }}
                >
                  Delete SED
                </button>
              )}
            </div>
          )}
        </div>

        <style>{`
          .article-prose h2 { font-size: 20px; font-weight: 600; margin-top: 32px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--card-border); color: var(--foreground); }
          .article-prose p { line-height: 1.8; margin-bottom: 16px; color: var(--foreground); font-size: 15px; }
        `}</style>
      </main>

      <ChatPanel
        context={chatContext}
        sedId={sed.id}
        title="Ask about this SED"
        subtitle="Answers are grounded in this document and related wiki content."
      />
    </div>
  );
}
