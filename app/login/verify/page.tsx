"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function VerifyTOTPPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid code");
        setCode("");
        inputRef.current?.focus();
        return;
      }

      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      // Auto-submit
      setTimeout(() => {
        document.getElementById("totp-form")?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
      }, 80);
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
            Two-factor authentication
          </h1>
        </div>

        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 24 }}>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Enter the 6-digit code from your authenticator app.
          </p>

          <form id="totp-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              ref={inputRef}
              className="search-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="000000"
              autoFocus
              style={{
                padding: "12px", fontSize: 24, borderRadius: 7,
                textAlign: "center", letterSpacing: "0.35em", fontVariantNumeric: "tabular-nums",
              }}
            />

            {error && (
              <p style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "8px 12px", margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                padding: "10px", fontSize: 13, fontWeight: 500,
                borderRadius: 7, border: "none",
                background: "var(--foreground)", color: "var(--background)",
                cursor: loading || code.length !== 6 ? "not-allowed" : "pointer",
                opacity: loading || code.length !== 6 ? 0.4 : 1,
              }}
            >
              {loading ? "Verifying…" : "Verify"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 16 }}>
          <a href="/login" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>
            ← Use a different account
          </a>
        </p>
      </div>
    </div>
  );
}
