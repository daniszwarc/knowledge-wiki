import { NextRequest, NextResponse } from "next/server";
import { query, getUserPlatformIds } from "@/lib/db";
import { validateSession } from "@/lib/auth";

interface Platform {
  id: string;
  name: string;
  slug: string;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("wiki_session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bypassFilter = ["admin", "super_admin", "developer"].includes(session.role);

  const rows = bypassFilter
    ? await query<Platform>(`SELECT id, name, slug FROM platforms ORDER BY created_at ASC`)
    : await (async () => {
        const platformIds = await getUserPlatformIds(session.userId);
        if (platformIds.length === 0) return [];
        return query<Platform>(
          `SELECT id, name, slug FROM platforms WHERE id = ANY($1::uuid[]) ORDER BY created_at ASC`,
          [platformIds]
        );
      })();

  return NextResponse.json(rows);
}
