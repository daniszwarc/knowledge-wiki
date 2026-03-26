import bcrypt from "bcryptjs";
import { generateSecret, generateURI, verifySync as otplibVerify } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import { query } from "@/lib/db";

export interface User {
  id: string;
  email: string;
  role: "viewer" | "validator" | "editor" | "admin";
  totp_secret: string | null;
  totp_enabled: boolean;
  created_at: string;
  last_login: string | null;
  created_by: string | null;
}

// ── Passwords ─────────────────────────────────────────────────────────────────

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── TOTP ──────────────────────────────────────────────────────────────────────

export function generateTOTPSecret(): string {
  return generateSecret();
}

export async function generateQRCode(email: string, secret: string): Promise<string> {
  const otpauth = generateURI({ secret, label: email, issuer: "APi GROUP Knowledge Wiki" });
  return QRCode.toDataURL(otpauth);
}

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    // verifySync returns { valid: boolean, ... }
    const result = otplibVerify({ token, secret }) as unknown as { valid: boolean };
    return result.valid === true;
  } catch {
    return false;
  }
}

// ── Sessions ──────────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, ipAddress: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

  await query(
    `INSERT INTO sessions (user_id, token_hash, expires_at, ip_address)
     VALUES ($1, $2, $3, $4)`,
    [userId, tokenHash, expiresAt.toISOString(), ipAddress]
  );

  return token;
}

export async function validateSession(
  token: string
): Promise<{ userId: string; email: string; role: string } | null> {
  const tokenHash = hashToken(token);

  const rows = await query<{ user_id: string; email: string; role: string; expires_at: string }>(
    `SELECT s.user_id, u.email, u.role, s.expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1`,
    [tokenHash]
  );

  if (rows.length === 0) return null;
  const row = rows[0];
  if (new Date(row.expires_at) < new Date()) {
    await query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
    return null;
  }

  return { userId: row.user_id, email: row.email, role: row.role };
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
}

// ── Temp tokens (for TOTP flow) ───────────────────────────────────────────────

export async function createTempToken(userId: string, totpSecret?: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await query(
    `INSERT INTO temp_tokens (user_id, token_hash, totp_secret, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, tokenHash, totpSecret ?? null, expiresAt.toISOString()]
  );

  return token;
}

export async function validateTempToken(
  token: string
): Promise<{ userId: string; totpSecret: string | null } | null> {
  const tokenHash = hashToken(token);

  const rows = await query<{ user_id: string; totp_secret: string | null; expires_at: string }>(
    `SELECT user_id, totp_secret, expires_at FROM temp_tokens WHERE token_hash = $1`,
    [tokenHash]
  );

  if (rows.length === 0) return null;
  const row = rows[0];
  if (new Date(row.expires_at) < new Date()) {
    await query(`DELETE FROM temp_tokens WHERE token_hash = $1`, [tokenHash]);
    return null;
  }

  return { userId: row.user_id, totpSecret: row.totp_secret };
}

export async function deleteTempToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await query(`DELETE FROM temp_tokens WHERE token_hash = $1`, [tokenHash]);
}

export async function updateTempTokenSecret(token: string, secret: string): Promise<void> {
  const tokenHash = hashToken(token);
  await query(`UPDATE temp_tokens SET totp_secret = $1 WHERE token_hash = $2`, [secret, tokenHash]);
}

// ── User queries ──────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<User | null> {
  const rows = await query<User>(
    `SELECT id, email, role, totp_secret, totp_enabled, created_at, last_login, created_by
     FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const rows = await query<User & { password_hash: string }>(
    `SELECT id, email, password_hash, role, totp_secret, totp_enabled, created_at, last_login, created_by
     FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}
