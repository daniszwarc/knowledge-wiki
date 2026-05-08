import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("wiki_session")?.value;

  if (token) {
    await deleteSession(token).catch(() => {});
  }

  const base = process.env.NEXTAUTH_URL ?? req.url;
  const response = NextResponse.redirect(new URL("/login", base));
  response.cookies.delete("wiki_session");
  response.cookies.delete("wiki_temp");
  return response;
}
