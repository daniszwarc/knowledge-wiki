"use client";

import { useEffect, useState } from "react";

interface Expert {
  id: string;
  name: string;
  email: string;
  department: string;
  domains: string[];
  risk_level: "critical" | "high" | "medium" | "low";
  created_at: string;
}

const RISK_ORDER = ["critical", "high", "medium", "low"] as const;

const RISK_LABEL: Record<string, string> = {
  critical: "Critical risk",
  high: "High risk",
  medium: "Medium risk",
  low: "Low risk",
};

function riskCardStyle(level: string) {
  if (level === "critical")
    return {
      background: "#fef2f2",
      border: "1px solid #fecaca",
      borderLeft: "4px solid #ef4444",
    };
  if (level === "high")
    return {
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      borderLeft: "4px solid #f97316",
    };
  return {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderLeft: "4px solid transparent",
  };
}

function riskBadgeStyle(level: string) {
  if (level === "critical")
    return { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" };
  if (level === "high")
    return { background: "#ffedd5", color: "#c2410c", border: "1px solid #fed7aa" };
  if (level === "medium")
    return { background: "#fef9c3", color: "#a16207", border: "1px solid #fde047" };
  return { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" };
}

const DEPT_ICONS: Record<string, string> = {
  Finance: "₣",
  Operations: "⚙",
  IT: "⌨",
};

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/experts")
      .then((r) => r.json())
      .then((data: Expert[]) => {
        setExperts(data);
        setLoading(false);
      });
  }, []);

  const grouped = RISK_ORDER.reduce<Record<string, Expert[]>>((acc, level) => {
    acc[level] = experts.filter((e) => e.risk_level === level);
    return acc;
  }, { critical: [], high: [], medium: [], low: [] });

  return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--background)",
        borderBottom: "1px solid var(--sidebar-border)",
        padding: "12px 32px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <a href="/" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
          <span>←</span> Home
        </a>
        <span style={{ fontSize: 12, color: "var(--muted-light)", opacity: 0.5 }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>Subject Matter Experts</span>
      </div>

      <div style={{ maxWidth: 900, width: "100%", padding: "32px 32px 64px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginBottom: 8 }}>
            Subject matter experts
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: 520 }}>
            Owners of documented business processes. Critical-risk experts are single points of failure
            — their knowledge is not yet fully captured in the wiki.
          </p>
        </div>

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ height: 110, borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--card-hover-bg)", opacity: 0.4 }} />
            ))}
          </div>
        )}

        {!loading && RISK_ORDER.map((level) => {
          const group = grouped[level];
          if (group.length === 0) return null;
          return (
            <div key={level} style={{ marginBottom: 36 }}>
              {/* Section heading */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <h2 style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: level === "critical" ? "#b91c1c" : "var(--muted)",
                  whiteSpace: "nowrap",
                }}>
                  {RISK_LABEL[level]}
                </h2>
                <hr style={{ flex: 1, border: "none", borderTop: `1px solid ${level === "critical" ? "#fecaca" : "var(--card-border)"}`, margin: 0 }} />
                <span style={{ fontSize: 11, color: "var(--muted-light)", flexShrink: 0 }}>{group.length}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {group.map((expert) => (
                  <div
                    key={expert.id}
                    style={{
                      ...riskCardStyle(expert.risk_level),
                      borderRadius: 10,
                      padding: 18,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {/* Name + risk badge */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 2 }}>
                          {expert.name}
                        </p>
                        <a
                          href={`mailto:${expert.email}`}
                          style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none" }}
                        >
                          {expert.email}
                        </a>
                      </div>
                      <span style={{ ...riskBadgeStyle(expert.risk_level), fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, flexShrink: 0, textTransform: "capitalize" }}>
                        {expert.risk_level}
                      </span>
                    </div>

                    {/* Department */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, opacity: 0.5 }}>{DEPT_ICONS[expert.department] ?? "◈"}</span>
                      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{expert.department}</span>
                    </div>

                    {/* Domains */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {expert.domains.map((domain) => (
                        <span
                          key={domain}
                          style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 99,
                            border: "1px solid var(--card-border)",
                            background: "var(--sidebar-bg)",
                            color: "var(--muted)",
                          }}
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {!loading && experts.length === 0 && (
          <div style={{ padding: "40px 24px", textAlign: "center", border: "1px solid var(--card-border)", borderRadius: 12, color: "var(--muted)" }}>
            <p style={{ fontSize: 14 }}>No experts found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
