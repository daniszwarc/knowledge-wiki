"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      if (data.requiresTOTP) {
        router.push("/login/verify");
      } else if (data.requiresEmailCode) {
        router.push("/login/verify-email");
      } else if (data.requiresSetup) {
        router.push("/login/setup-2fa");
      }
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

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>
            APi GROUP
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginTop: 4 }}>
            Knowledge Wiki
          </h1>
        </div>

        {/* Card */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", marginBottom: 20 }}>
            Sign in
          </h2>

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

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>Password</label>
              <input
                className="search-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted-light)", marginTop: 20 }}>
          Contact your manager to get access.
        </p>
      </div>
    </div>
  );
}
