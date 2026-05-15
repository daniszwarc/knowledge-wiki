import { NextRequest, NextResponse } from "next/server";
import { validatePasswordResetToken, updatePassword, usePasswordResetToken } from "@/lib/auth";

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password required" }, { status: 400 });
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters with one uppercase letter and one number" },
        { status: 400 }
      );
    }

    const result = await validatePasswordResetToken(token);
    if (!result) {
      return NextResponse.json({ error: "This link has expired or is invalid" }, { status: 400 });
    }

    await updatePassword(result.userId, password);
    await usePasswordResetToken(token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
