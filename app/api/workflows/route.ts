import { NextResponse } from "next/server";
import { getAllWorkflowsWithStats } from "@/lib/db";

export async function GET() {
  try {
    const workflows = await getAllWorkflowsWithStats();
    return NextResponse.json(workflows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
