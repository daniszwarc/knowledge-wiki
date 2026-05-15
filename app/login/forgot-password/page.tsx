"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setSubmitted(true);
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
            Reset your password
          </h1>
        </div>

        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 24 }}>
          {submitted ? (
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
              If an account exists for that email address, you will receive a reset link shortly.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>Email</label>
                  <input
                    className="search-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    style={{ padding: "9px 12px", fontSize: 13, borderRadius: 7 }}
                  />
                </div>
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
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 16 }}>
          <a href="/login" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>
            ← Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
