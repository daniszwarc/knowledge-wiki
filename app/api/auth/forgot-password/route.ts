import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, generatePasswordResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

const rateLimits = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: true });
    }

    const emailKey = email.toLowerCase().trim();
    const now = Date.now();
    const window = rateLimits.get(emailKey) ?? { count: 0, resetAt: now + 10 * 60_000 };
    if (now > window.resetAt) { window.count = 0; window.resetAt = now + 10 * 60_000; }
    if (++window.count > 3) {
      rateLimits.set(emailKey, window);
      return NextResponse.json({ ok: true });
    }
    rateLimits.set(emailKey, window);

    const user = await getUserByEmail(emailKey);
    if (user) {
      const token = await generatePasswordResetToken(user.id);
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const resetUrl = `${baseUrl}/login/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: true });
  }
}
