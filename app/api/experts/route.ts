import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const experts = await query<{
      id: string;
      name: string;
      email: string;
      department: string;
      domains: string[];
      risk_level: string;
      created_at: string;
    }>(
      `SELECT id, name, email, department, domains, risk_level, created_at
       FROM experts
       ORDER BY
         CASE risk_level
           WHEN 'critical' THEN 1
           WHEN 'high'     THEN 2
           WHEN 'medium'   THEN 3
           WHEN 'low'      THEN 4
           ELSE 5
         END,
         department, name`
    );
    return NextResponse.json(experts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
