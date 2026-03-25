import { NextRequest, NextResponse } from "next/server";
import { hybridSearch } from "@/lib/search";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({ error: "Missing query parameter q" }, { status: 400 });
    }
    const results = await hybridSearch(q);
    return NextResponse.json(results);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
