import { NextRequest, NextResponse } from "next/server";
import { hybridSearch } from "@/lib/search";
import { validateSession } from "@/lib/auth";
import { getUserCompanyIds } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({ error: "Missing query parameter q" }, { status: 400 });
    }

    const bypassFilter = ["admin", "super_admin", "developer"].includes(session.role);
    const companyIds = bypassFilter ? undefined : await getUserCompanyIds(session.userId);

    const results = await hybridSearch(q, companyIds);
    return NextResponse.json(results);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
