import { NextRequest, NextResponse } from "next/server";
import {
  validateTempToken,
  deleteTempToken,
  verifyTOTP,
  createSession,
  getUserById,
} from "@/lib/auth";

const totpAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const tempToken = req.cookies.get("wiki_temp")?.value;

    if (!tempToken) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const now = Date.now();
    const window = totpAttempts.get(tempToken) ?? { count: 0, resetAt: now + 300_000 };
    if (now > window.resetAt) { window.count = 0; window.resetAt = now + 300_000; }
    if (++window.count > 5) {
      totpAttempts.set(tempToken, window);
      await deleteTempToken(tempToken);
      return NextResponse.json({ error: "Too many attempts. Please log in again." }, { status: 429 });
    }
    totpAttempts.set(tempToken, window);

    const temp = await validateTempToken(tempToken);
    if (!temp) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const user = await getUserById(temp.userId);
    if (!user || !user.totp_secret) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const valid = verifyTOTP(token, user.totp_secret);
    if (!valid) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
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
