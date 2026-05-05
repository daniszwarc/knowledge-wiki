import { NextRequest, NextResponse } from "next/server";
import { getAllWorkflowsWithStats, getUserCompanyIds } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bypassFilter = ["admin", "super_admin", "developer"].includes(session.role);
    const companyIds = bypassFilter ? undefined : await getUserCompanyIds(session.userId);

    const workflows = await getAllWorkflowsWithStats(companyIds);
    return NextResponse.json(workflows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
