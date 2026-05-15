import { NextRequest, NextResponse } from "next/server";
import {
  validateTempToken,
  deleteTempToken,
  updateTempTokenSecret,
  generateTOTPSecret,
  generateQRCode,
  verifyTOTP,
  createSession,
  getUserById,
} from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const tempToken = req.cookies.get("wiki_temp")?.value;
    if (!tempToken) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const temp = await validateTempToken(tempToken);
    if (!temp) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const user = await getUserById(temp.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Use existing secret if already generated this session, else create new
    const secret = temp.totpSecret ?? generateTOTPSecret();

    if (!temp.totpSecret) {
      await updateTempTokenSecret(tempToken, secret);
    }

    const qrCode = await generateQRCode(user.email, secret);

    return NextResponse.json({ qrCode, secret });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const tempToken = req.cookies.get("wiki_temp")?.value;

    if (!tempToken) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const temp = await validateTempToken(tempToken);
    if (!temp || !temp.totpSecret) {
      return NextResponse.json({ error: "Session expired or QR not generated" }, { status: 401 });
    }

    const valid = verifyTOTP(token, temp.totpSecret);
    if (!valid) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    }

    // Save secret and enable TOTP
    await query(
      `UPDATE users SET totp_secret = $1, totp_enabled = true WHERE id = $2`,
      [temp.totpSecret, temp.userId]
    );

    await deleteTempToken(tempToken);

    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const sessionToken = await createSession(temp.userId, ip);

    const user = await getUserById(temp.userId);
    const response = NextResponse.json({
      success: true,
      role: user?.role,
      mustChangePassword: user?.must_change_password ?? false,
    });
    response.cookies.set("wiki_session", sessionToken, {
      httpOnly: true,
      path: "/",
      maxAge: 8 * 60 * 60,
      sameSite: "lax",
    });
    response.cookies.delete("wiki_temp");

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
