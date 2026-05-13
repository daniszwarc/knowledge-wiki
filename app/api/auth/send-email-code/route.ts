import { NextRequest, NextResponse } from "next/server";
import { validateTempToken, getUserById, generateEmailCode } from "@/lib/auth";
import { sendVerificationCode } from "@/lib/email";

const sendAttempts = new Map<string, { count: number; resetAt: number }>();

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || local.length <= 2) return email;
  return `${local[0]}****@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const tempToken = req.cookies.get("wiki_temp")?.value;
    if (!tempToken) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const now = Date.now();
    const window = sendAttempts.get(tempToken) ?? { count: 0, resetAt: now + 600_000 };
    if (now > window.resetAt) { window.count = 0; window.resetAt = now + 600_000; }
    if (++window.count > 3) {
      sendAttempts.set(tempToken, window);
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    sendAttempts.set(tempToken, window);

    const temp = await validateTempToken(tempToken);
    if (!temp) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const user = await getUserById(temp.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const code = await generateEmailCode(user.id);
    await sendVerificationCode(user.email, code);

    return NextResponse.json({ ok: true, email: maskEmail(user.email) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
