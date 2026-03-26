import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("wiki_session")?.value;

  if (token) {
    await deleteSession(token).catch(() => {});
  }

  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.delete("wiki_session");
  response.cookies.delete("wiki_temp");
  return response;
}
