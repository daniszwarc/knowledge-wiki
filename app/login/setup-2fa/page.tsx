"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "selecting" | "totp-setup" | "email-verify";

const cardStyle: React.CSSProperties = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: 12,
  padding: 24,
};

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#b91c1c",
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  borderRadius: 6,
  padding: "8px 12px",
  margin: 0,
};

export default function Setup2FAPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("selecting");

  // TOTP state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  // Shared code input state
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Email state
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);

  async function selectTotp() {
    setLoading(true);
    setFetchError("");
    try {
      await fetch("/api/auth/set-2fa-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "totp" }),
      });
      const r = await fetch("/api/auth/setup-2fa");
      if (!r.ok) {
        setFetchError("Session expired. Please sign in again.");
        return;
      }
      const data = await r.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setCode("");
      setStep("totp-setup");
    } catch {
      setFetchError("Failed to load QR code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function selectEmail() {
    setLoading(true);
    setFetchError("");
    try {
      await fetch("/api/auth/set-2fa-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "email" }),
      });
      const r = await fetch("/api/auth/send-email-code", { method: "POST" });
      if (!r.ok) {
        setFetchError("Failed to send verification code. Please try again.");
        return;
      }
      const data = await r.json();
      setMaskedEmail(data.email ?? "");
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 60_000);
      setCode("");
      setStep("email-verify");
    } catch {
      setFetchError("Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code");
        setCode("");
        return;
      }
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
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
        return;
      }
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setResendDisabled(true);
    try {
      await fetch("/api/auth/send-email-code", { method: "POST" });
    } catch {
      // silently ignore
    }
    setTimeout(() => setResendDisabled(false), 60_000);
  }

  const pageWrapper: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--background)",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  };

  const header = (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>
        APi GROUP
      </p>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginTop: 4 }}>
        Set up two-factor authentication
      </h1>
    </div>
  );

  if (fetchError) {
    return (
      <div style={pageWrapper}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#b91c1c", marginBottom: 12 }}>{fetchError}</p>
          <a href="/login" style={{ fontSize: 13, color: "var(--muted)" }}>← Back to sign in</a>
        </div>
      </div>
    );
  }

  // ── Step: selecting method ────────────────────────────────────────────────────
  if (step === "selecting") {
    return (
      <div style={pageWrapper}>
        <div style={{ width: "100%", maxWidth: 420, padding: "0 24px" }}>
          {header}
          <div style={cardStyle}>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
              Choose how you want to verify your identity each time you sign in.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={selectTotp}
                disabled={loading}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start",
                  padding: "14px 16px", borderRadius: 8,
                  border: "1px solid var(--card-border)",
                  background: "var(--card-hover-bg, var(--card-bg))",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1, textAlign: "left",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  Authenticator app
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                  Use Google Authenticator, Authy, or any TOTP app
                </span>
              </button>

              <button
                onClick={selectEmail}
                disabled={loading}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start",
                  padding: "14px 16px", borderRadius: 8,
                  border: "1px solid var(--card-border)",
                  background: "var(--card-hover-bg, var(--card-bg))",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1, textAlign: "left",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  Email code
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                  Receive a 6-digit code by email each time you sign in
                </span>
              </button>
            </div>

            {loading && (
              <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 16 }}>
                Setting up…
              </p>
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

  // ── Step: TOTP setup ──────────────────────────────────────────────────────────
  if (step === "totp-setup") {
    return (
      <div style={pageWrapper}>
        <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
          {header}
          <div style={cardStyle}>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
              Scan this QR code with <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app.
            </p>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              {qrCode ? (
                <img src={qrCode} alt="QR code for 2FA setup" style={{ width: 180, height: 180, borderRadius: 8, border: "1px solid var(--card-border)" }} />
              ) : (
                <div style={{ width: 180, height: 180, borderRadius: 8, background: "var(--card-hover-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--muted-light)" }}>Loading…</span>
                </div>
              )}
            </div>

            {secret && (
              <div style={{ marginBottom: 20, padding: "10px 12px", background: "var(--sidebar-bg)", borderRadius: 7, border: "1px solid var(--card-border)" }}>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Or enter this key manually:</p>
                <code style={{ fontSize: 12, letterSpacing: "0.15em", color: "var(--foreground)", fontFamily: "monospace", wordBreak: "break-all" }}>
                  {secret.match(/.{1,4}/g)?.join(" ")}
                </code>
              </div>
            )}

            <form onSubmit={handleTotpSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>
                Enter the 6-digit code to confirm setup
              </label>
              <input
                className="search-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                style={{ padding: "10px 12px", fontSize: 20, borderRadius: 7, textAlign: "center", letterSpacing: "0.35em" }}
              />
              {error && <p style={errorStyle}>{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                style={{
                  marginTop: 4, padding: "10px", fontSize: 13, fontWeight: 500,
                  borderRadius: 7, border: "none",
                  background: "var(--foreground)", color: "var(--background)",
                  cursor: loading || code.length !== 6 ? "not-allowed" : "pointer",
                  opacity: loading || code.length !== 6 ? 0.4 : 1,
                }}
              >
                {loading ? "Verifying…" : "Activate 2FA & continue"}
              </button>
            </form>
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

  // ── Step: email verify ────────────────────────────────────────────────────────
  return (
    <div style={pageWrapper}>
      <div style={{ width: "100%", maxWidth: 360, padding: "0 24px" }}>
        {header}
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
            We sent a 6-digit code to{" "}
            <strong>{maskedEmail || "your email"}</strong>. Enter it below to finish setup.
          </p>

          <form id="email-setup-form" onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              className="search-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(digits);
                if (digits.length === 6) {
                  setTimeout(() => {
                    document.getElementById("email-setup-form")?.dispatchEvent(
                      new Event("submit", { bubbles: true, cancelable: true })
                    );
                  }, 80);
                }
              }}
              placeholder="000000"
              autoFocus
              style={{
                padding: "12px", fontSize: 24, borderRadius: 7,
                textAlign: "center", letterSpacing: "0.35em", fontVariantNumeric: "tabular-nums",
              }}
            />

            {error && <p style={errorStyle}>{error}</p>}

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
              {loading ? "Verifying…" : "Verify & continue"}
            </button>

            <button
              type="button"
              onClick={resendCode}
              disabled={resendDisabled}
              style={{
                padding: "8px", fontSize: 12, borderRadius: 7,
                border: "1px solid var(--card-border)",
                background: "transparent", color: resendDisabled ? "var(--muted-light)" : "var(--muted)",
                cursor: resendDisabled ? "not-allowed" : "pointer",
              }}
            >
              {resendDisabled ? "Code sent — wait before resending" : "Resend code"}
            </button>
          </form>
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
