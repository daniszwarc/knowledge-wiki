import { NextRequest, NextResponse } from "next/server";
import {
  validateTempToken,
  deleteTempToken,
  verifyEmailCode,
  getUserById,
  createSession,
} from "@/lib/auth";

const codeAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const tempToken = req.cookies.get("wiki_temp")?.value;
    if (!tempToken) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const now = Date.now();
    const window = codeAttempts.get(tempToken) ?? { count: 0, resetAt: now + 600_000 };
    if (now > window.resetAt) { window.count = 0; window.resetAt = now + 600_000; }
    if (++window.count > 5) {
      codeAttempts.set(tempToken, window);
      await deleteTempToken(tempToken);
      return NextResponse.json({ error: "Too many attempts. Please log in again." }, { status: 429 });
    }
    codeAttempts.set(tempToken, window);

    const temp = await validateTempToken(tempToken);
    if (!temp) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const user = await getUserById(temp.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const valid = await verifyEmailCode(user.id, code);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    await deleteTempToken(tempToken);

    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const sessionToken = await createSession(user.id, ip);

    const response = NextResponse.json({
      success: true,
      role: user.role,
      mustChangePassword: user.must_change_password ?? false,
    });
    response.cookies.set("wiki_session", sessionToken, {
      httpOnly: true,
      path: "/",
      maxAge: 8 * 60 * 60,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.delete("wiki_temp");

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
