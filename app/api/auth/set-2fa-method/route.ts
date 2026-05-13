import { NextRequest, NextResponse } from "next/server";
import { validateTempToken, setTwoFaMethod } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const tempToken = req.cookies.get("wiki_temp")?.value;
    if (!tempToken) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const temp = await validateTempToken(tempToken);
    if (!temp) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const { method } = await req.json();
    if (method !== "totp" && method !== "email") {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }

    await setTwoFaMethod(temp.userId, method);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
