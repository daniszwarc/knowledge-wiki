"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resendDisabled, setResendDisabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const didSend = useRef(false);

  useEffect(() => {
    if (didSend.current) return;
    didSend.current = true;
    fetch("/api/auth/send-email-code", { method: "POST" })
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        setMaskedEmail(data.email ?? "");
      })
      .catch(() => {/* session likely expired, form will show error on submit */});

    // Disable resend for 60s after the initial send
    const timer = setTimeout(() => setResendDisabled(false), 60_000);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid code");
        setCode("");
        inputRef.current?.focus();
        return;
      }

      if (data.mustChangePassword) {
        router.push("/account?setup=true");
      } else {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      setTimeout(() => {
        document.getElementById("email-verify-form")?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
      }, 80);
    }
  }

  async function resendCode() {
    setResendDisabled(true);
    try {
      const r = await fetch("/api/auth/send-email-code", { method: "POST" });
      if (r.ok) {
        const data = await r.json();
        if (data.email) setMaskedEmail(data.email);
      }
    } catch {
      // silently ignore
    }
    setTimeout(() => setResendDisabled(false), 60_000);
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
            Check your email
          </h1>
        </div>

        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 24 }}>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
            We sent a 6-digit code to{" "}
            <strong>{maskedEmail || "your email"}</strong>. Enter it below.
          </p>

          <form id="email-verify-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

            <button
              type="button"
              onClick={resendCode}
              disabled={resendDisabled}
              style={{
                padding: "8px", fontSize: 12, borderRadius: 7,
                border: "1px solid var(--card-border)",
                background: "transparent",
                color: resendDisabled ? "var(--muted-light)" : "var(--muted)",
                cursor: resendDisabled ? "not-allowed" : "pointer",
              }}
            >
              {resendDisabled ? "Code sent — wait before resending" : "Resend code"}
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
