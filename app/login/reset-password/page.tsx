"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const REQUIREMENTS = "Min 8 characters · one uppercase letter · one number";

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!token) setExpired(true);
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isStrongPassword(password)) {
      setError("Password must be at least 8 characters with one uppercase letter and one number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data.error?.includes("expired")) {
          setExpired(true);
        } else {
          setError(data.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--background)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 360, padding: "0 24px" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>
            APi GROUP
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginTop: 4 }}>
            Set new password
          </h1>
        </div>

        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 24 }}>
          {expired ? (
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
              This link has expired or is invalid.{" "}
              <a href="/login/forgot-password" style={{ color: "var(--foreground)" }}>Request a new one.</a>
            </p>
          ) : success ? (
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
              Password updated. You can now{" "}
              <a href="/login" style={{ color: "var(--foreground)" }}>sign in</a>.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 12, color: "var(--muted-light)", marginBottom: 20 }}>
                {REQUIREMENTS}
              </p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>New password</label>
                  <input
                    className="search-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    style={{ padding: "9px 12px", fontSize: 13, borderRadius: 7 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>Confirm new password</label>
                  <input
                    className="search-input"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    style={{ padding: "9px 12px", fontSize: 13, borderRadius: 7 }}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "8px 12px", margin: 0 }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: 4, padding: "10px", fontSize: 13, fontWeight: 500,
                    borderRadius: 7, border: "none",
                    background: "var(--foreground)", color: "var(--background)",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>

        {!success && !expired && (
          <p style={{ textAlign: "center", marginTop: 16 }}>
            <a href="/login" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>
              ← Back to sign in
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
