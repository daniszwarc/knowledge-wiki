"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Setup2FAPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    fetch("/api/auth/setup-2fa")
      .then(async (r) => {
        if (!r.ok) { setFetchError("Session expired. Please sign in again."); return; }
        const data = await r.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
      })
      .catch(() => setFetchError("Failed to load QR code."));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
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

  if (fetchError) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#b91c1c", marginBottom: 12 }}>{fetchError}</p>
          <a href="/login" style={{ fontSize: 13, color: "var(--muted)" }}>← Back to sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--background)", fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>
            APi GROUP
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginTop: 4 }}>
            Set up two-factor authentication
          </h1>
        </div>

        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 24 }}>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Scan this QR code with <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app.
          </p>

          {/* QR Code */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            {qrCode ? (
              <img src={qrCode} alt="QR code for 2FA setup" style={{ width: 180, height: 180, borderRadius: 8, border: "1px solid var(--card-border)" }} />
            ) : (
              <div style={{ width: 180, height: 180, borderRadius: 8, background: "var(--card-hover-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, color: "var(--muted-light)" }}>Loading…</span>
              </div>
            )}
          </div>

          {/* Manual secret */}
          {secret && (
            <div style={{ marginBottom: 20, padding: "10px 12px", background: "var(--sidebar-bg)", borderRadius: 7, border: "1px solid var(--card-border)" }}>
              <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Or enter this key manually:</p>
              <code style={{ fontSize: 12, letterSpacing: "0.15em", color: "var(--foreground)", fontFamily: "monospace", wordBreak: "break-all" }}>
                {secret.match(/.{1,4}/g)?.join(" ")}
              </code>
            </div>
          )}

          {/* Verification */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
              style={{
                padding: "10px 12px", fontSize: 20, borderRadius: 7,
                textAlign: "center", letterSpacing: "0.35em",
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
