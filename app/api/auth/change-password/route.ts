import { NextRequest, NextResponse } from "next/server";
import { validateSession, verifyCurrentPassword, updatePassword } from "@/lib/auth";

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
    }

    const valid = await verifyCurrentPassword(session.userId, currentPassword);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    if (!isStrongPassword(newPassword)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters with one uppercase letter and one number" },
        { status: 400 }
      );
    }

    await updatePassword(session.userId, newPassword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
