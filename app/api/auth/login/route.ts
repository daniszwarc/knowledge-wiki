import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, verifyPassword, createTempToken } from "@/lib/auth";
import { query } from "@/lib/db";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const now = Date.now();
    const window = loginAttempts.get(ip) ?? { count: 0, resetAt: now + 60_000 };
    if (now > window.resetAt) { window.count = 0; window.resetAt = now + 60_000; }
    if (++window.count > 10) {
      loginAttempts.set(ip, window);
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    loginAttempts.set(ip, window);

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Update last_login
    await query(`UPDATE users SET last_login = now() WHERE id = $1`, [user.id]);

    const tempToken = await createTempToken(user.id);

    const hasTOTP = user.totp_enabled === true && user.totp_secret !== null;

    const response = NextResponse.json(
      hasTOTP
        ? { requiresTOTP: true }
        : { requiresSetup: true }
    );

    response.cookies.set("wiki_temp", tempToken, {
      httpOnly: true,
      path: "/",
      maxAge: 5 * 60, // 5 minutes
      sameSite: "lax",
      secure: true,
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
