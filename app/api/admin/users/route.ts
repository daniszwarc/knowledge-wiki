import { NextRequest, NextResponse } from "next/server";
import { query, getUserCompanyIds } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const ADMIN_ROLES = ["admin", "super_admin", "developer"];

function getCallerInfo(req: NextRequest) {
  return {
    role: req.headers.get("x-user-role") ?? "",
    userId: req.headers.get("x-user-id") ?? "",
    email: req.headers.get("x-user-email") ?? "",
  };
}

export async function GET(req: NextRequest) {
  const { role, userId } = getCallerInfo(req);
  if (!["admin", "super_admin", "company_admin", "developer"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role === "company_admin") {
    const myCompanyIds = await getUserCompanyIds(userId);
    if (myCompanyIds.length === 0) return NextResponse.json([]);

    const users = await query<{
      id: string; email: string; role: string;
      totp_enabled: boolean; last_login: string | null; created_at: string;
    }>(
      `SELECT DISTINCT u.id, u.email, u.role, u.totp_enabled, u.last_login, u.created_at
       FROM users u
       JOIN user_companies uc ON uc.user_id = u.id
       WHERE uc.company_id = ANY($1::uuid[])
       ORDER BY u.created_at`,
      [myCompanyIds]
    );
    return NextResponse.json(users);
  }

  const users = await query<{
    id: string; email: string; role: string;
    totp_enabled: boolean; last_login: string | null; created_at: string;
  }>(
    `SELECT id, email, role, totp_enabled, last_login, created_at
     FROM users ORDER BY created_at`
  );
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { role: callerRole, userId: callerId, email: callerEmail } = getCallerInfo(req);
  if (!["admin", "super_admin", "company_admin", "developer"].includes(callerRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, password, role, companies } = await req.json();
  if (!email || !password || !role) {
    return NextResponse.json({ error: "email, password, and role required" }, { status: 400 });
  }

  // company_admin cannot create admin/super_admin users
  if (callerRole === "company_admin" && ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden: cannot assign that role" }, { status: 403 });
  }

  // company_admin can only assign companies they belong to
  let allowedCompanies: string[] | null = null;
  if (callerRole === "company_admin") {
    allowedCompanies = await getUserCompanyIds(callerId);
  }

  const hash = await hashPassword(password);
  const rows = await query<{ id: string }>(
    `INSERT INTO users (email, password_hash, role, totp_enabled, created_by)
     VALUES ($1, $2, $3, false, $4) RETURNING id`,
    [email.toLowerCase().trim(), hash, role, callerEmail]
  );

  const userId = rows[0].id;
  if (Array.isArray(companies) && companies.length > 0) {
    for (const companyId of companies) {
      if (allowedCompanies && !allowedCompanies.includes(companyId)) continue;
      await query(
        `INSERT INTO user_companies (user_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, companyId]
      );
    }
  }

  return NextResponse.json({ id: userId }, { status: 201 });
}
