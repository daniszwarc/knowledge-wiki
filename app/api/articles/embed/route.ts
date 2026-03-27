import { NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/ollama";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { articleId, text } = await req.json();
    if (!articleId || !text) {
      return NextResponse.json({ error: "articleId and text required" }, { status: 400 });
    }

    const embedding = await embed(text);
    const vectorLiteral = `[${embedding.join(",")}]`;

    await query(
      `UPDATE articles SET embedding = $1::vector WHERE id = $2`,
      [vectorLiteral, articleId]
    );

    return NextResponse.json({ articleId, dimensions: embedding.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
