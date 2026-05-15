import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { validateSession } from "@/lib/auth";

function requireAdmin(req: NextRequest) {
  const role = req.headers.get("x-user-role");
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

// PATCH: change role or reset 2FA
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "developer"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // Allow any authenticated user to reset their own 2FA
  const isSelfReset = body.reset2fa === true && id === session.userId && Object.keys(body).length === 1;

  if (!isSelfReset) {
    const err = requireAdmin(req);
    if (err) return err;
  }

  if (body.role !== undefined) {
    await query(`UPDATE users SET role = $1 WHERE id = $2`, [body.role, id]);
  }

  if (body.reset2fa) {
    await query(
      `UPDATE users SET totp_enabled = false, totp_secret = null WHERE id = $1`,
      [id]
    );
  }

  if (Array.isArray(body.companies)) {
    await query(`DELETE FROM user_companies WHERE user_id = $1`, [id]);
    for (const companyId of body.companies) {
      await query(
        `INSERT INTO user_companies (user_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id, companyId]
      );
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE: remove user (cannot delete self)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "developer"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const err = requireAdmin(req);
  if (err) return err;

  const { id } = await params;
  if (id === session.userId) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await query(`DELETE FROM users WHERE id = $1`, [id]);
  return NextResponse.json({ success: true });
}
