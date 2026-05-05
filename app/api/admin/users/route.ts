import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

function requireAdmin(req: NextRequest) {
  const role = req.headers.get("x-user-role");
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const err = requireAdmin(req);
  if (err) return err;

  const users = await query<{
    id: string;
    email: string;
    role: string;
    totp_enabled: boolean;
    last_login: string | null;
    created_at: string;
  }>(
    `SELECT id, email, role, totp_enabled, last_login, created_at
     FROM users ORDER BY created_at`
  );

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const err = requireAdmin(req);
  if (err) return err;

  const { email, password, role, companies } = await req.json();
  if (!email || !password || !role) {
    return NextResponse.json({ error: "email, password, and role required" }, { status: 400 });
  }

  const hash = await hashPassword(password);
  const createdBy = req.headers.get("x-user-email") ?? "admin";

  const rows = await query<{ id: string }>(
    `INSERT INTO users (email, password_hash, role, totp_enabled, created_by)
     VALUES ($1, $2, $3, false, $4) RETURNING id`,
    [email.toLowerCase().trim(), hash, role, createdBy]
  );

  const userId = rows[0].id;
  if (Array.isArray(companies) && companies.length > 0) {
    for (const companyId of companies) {
      await query(
        `INSERT INTO user_companies (user_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, companyId]
      );
    }
  }

  return NextResponse.json({ id: userId }, { status: 201 });
}
