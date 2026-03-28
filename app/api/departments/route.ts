import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query<{ department: string }>(
      `SELECT department FROM workflows WHERE department IS NOT NULL AND department <> ''
       UNION
       SELECT department FROM articles WHERE department IS NOT NULL AND department <> ''
       ORDER BY department`
    );
    return NextResponse.json(rows.map((r) => r.department));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
