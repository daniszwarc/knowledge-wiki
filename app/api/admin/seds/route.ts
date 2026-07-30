import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("wiki_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await validateSession(token);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deletedCount = await withTransaction(async (client) => {
      const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM seds`);
      const count = rows[0].count as number;

      await client.query(`UPDATE seds SET embedding = NULL`);
      await client.query(`DELETE FROM seds`);

      await client.query(
        `INSERT INTO audit_log (table_name, record_id, action, changed_by, previous_value)
         VALUES ('seds', NULL, 'DELETE', $1, $2::jsonb)`,
        [session.email, JSON.stringify({ deleted_count: count, scope: "all" })]
      );

      return count;
    });

    return NextResponse.json({ success: true, deletedCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
