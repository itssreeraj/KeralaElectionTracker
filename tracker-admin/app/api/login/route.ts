export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (
    username !== process.env.ADMIN_USER ||
    password !== process.env.ADMIN_PASS
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET!, {
    expiresIn: "12h",
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set("ADMIN_TOKEN", token, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/",
  });

  return res;
}
