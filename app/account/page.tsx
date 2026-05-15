"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

interface MeData {
  id: string;
  email: string;
  role: string;
  two_fa_method: string;
  created_at: string;
}

const REQUIREMENTS = "Min 8 characters · one uppercase letter · one number";

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const ROLE_COLORS: Record<string, string> = {
  admin: "#7c3aed",
  developer: "#1d4ed8",
  editor: "#065f46",
  validator: "#92400e",
  viewer: "#374151",
};

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "true";

  const [me, setMe] = useState<MeData | null>(null);
  const [passwordDone, setPasswordDone] = useState(false);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  // 2FA reset
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setMe(data); });
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (!isStrongPassword(newPassword)) {
      setPwError("Password must be at least 8 characters with one uppercase letter and one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPwError(data.error ?? "Something went wrong.");
        return;
      }

      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordDone(true);

      if (isSetup) {
        setTimeout(() => router.push("/"), 1000);
      }
    } finally {
      setPwLoading(false);
    }
  }

  async function handleReset2FA() {
    if (!me) return;
    setResetError("");
    setResetLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${me.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset2fa: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        setResetError(data.error ?? "Failed to reset 2FA.");
        return;
      }

      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login?msg=2fa-reset");
    } finally {
      setResetLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "9px 12px", fontSize: 13, borderRadius: 7, width: "100%", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: "var(--muted)",
  };

  const sectionStyle: React.CSSProperties = {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      <Sidebar me={me} />

      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 680, overflowY: "auto" }}>

        {isSetup && !passwordDone && (
          <div style={{
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: 10,
            padding: "14px 18px",
            marginBottom: 24,
          }}>
            <p style={{ fontSize: 13, color: "#78350f", margin: 0, lineHeight: 1.6 }}>
              Please set a new password before continuing. This is required on first login.
            </p>
          </div>
        )}

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", marginBottom: 24 }}>
          Your account
        </h1>

        {/* Profile section */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 16 }}>
            Profile
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: 4 }}>Email</p>
              <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>{me?.email ?? "—"}</p>
            </div>
            <div>
              <p style={{ ...labelStyle, marginBottom: 4 }}>Role</p>
              {me?.role && (
                <span style={{
                  display: "inline-block",
                  fontSize: 11, fontWeight: 600,
                  padding: "2px 8px", borderRadius: 4,
                  background: ROLE_COLORS[me.role] ?? "#374151",
                  color: "#fff",
                  textTransform: "capitalize",
                }}>
                  {me.role}
                </span>
              )}
            </div>
            <div>
              <p style={{ ...labelStyle, marginBottom: 4 }}>Member since</p>
              <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                {me?.created_at ? formatMemberSince(me.created_at) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* 2FA section */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 16 }}>
            Two-factor authentication
          </h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: 4 }}>Current method</p>
              <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>
                {me?.two_fa_method === "email" ? "Email code" : "Authenticator app"}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <button
                onClick={handleReset2FA}
                disabled={resetLoading}
                style={{
                  padding: "8px 14px", fontSize: 12, fontWeight: 500,
                  borderRadius: 7, border: "1px solid var(--card-border)",
                  background: "transparent", color: "var(--foreground)",
                  cursor: resetLoading ? "not-allowed" : "pointer",
                  opacity: resetLoading ? 0.5 : 1,
                }}
              >
                {resetLoading ? "Resetting…" : "Reset 2FA"}
              </button>
              {resetError && (
                <p style={{ fontSize: 12, color: "#b91c1c", margin: 0 }}>{resetError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Change password section */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 6 }}>
            Change password
          </h2>
          <p style={{ fontSize: 12, color: "var(--muted-light)", marginBottom: 20 }}>
            {REQUIREMENTS}
          </p>

          <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={labelStyle}>Current password</label>
              <input
                className="search-input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={labelStyle}>New password</label>
              <input
                className="search-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={labelStyle}>Confirm new password</label>
              <input
                className="search-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {pwError && (
              <p style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "8px 12px", margin: 0 }}>
                {pwError}
              </p>
            )}

            {pwSuccess && (
              <p style={{ fontSize: 12, color: "#065f46", background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 6, padding: "8px 12px", margin: 0 }}>
                Password updated.
              </p>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              style={{
                padding: "10px", fontSize: 13, fontWeight: 500,
                borderRadius: 7, border: "none",
                background: "var(--foreground)", color: "var(--background)",
                cursor: pwLoading ? "not-allowed" : "pointer",
                opacity: pwLoading ? 0.5 : 1,
              }}
            >
              {pwLoading ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountContent />
    </Suspense>
  );
}
